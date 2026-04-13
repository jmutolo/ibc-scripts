(function () {
  'use strict';

  var MESSAGE_TYPE = 'IBC_IFRAME_HEIGHT';
  var lastHeight = 0;
  var rafId = 0;

  function toInt(value) {
    var n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  function getDocumentHeight() {
    var body = document.body;
    var html = document.documentElement;

    if (!body || !html) return 0;

    // Temporarily override any fixed height on body/html that the parent may have injected,
    // so scrollHeight reflects actual content rather than the forced container size.
    var prevBodyHeight = body.style.height;
    var prevHtmlHeight = html.style.height;
    body.style.height = 'auto';
    html.style.height = 'auto';

    var all = body.querySelectorAll('*');
    var maxBottom = 0;

    for (var i = 0; i < all.length; i++) {
      var el = all[i];

      var style = window.getComputedStyle(el);

      // Skip fixed/sticky elements — they don't contribute to document flow
      if (style.position === 'fixed' || style.position === 'sticky') continue;

      // Skip invisible elements
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      // Walk the offset chain to get the true document-relative top
      var offsetTop = 0;
      var node = el;
      while (node && node !== body) {
        offsetTop += node.offsetTop || 0;
        node = node.offsetParent;
      }

      var bottom = offsetTop + (el.offsetHeight || 0);
      if (bottom > maxBottom) maxBottom = bottom;
    }

    // Restore original styles
    body.style.height = prevBodyHeight;
    html.style.height = prevHtmlHeight;

    // Fall back to scrollHeight if walk produced nothing
    if (maxBottom <= 0) {
      maxBottom = Math.max(body.scrollHeight, body.offsetHeight, html.scrollHeight, html.offsetHeight);
    }

    return toInt(maxBottom);
  }

  function postHeight(force) {
    if (!window.parent || window.parent === window) return;

    var nextHeight = toInt(getDocumentHeight());
    if (!force && nextHeight <= 0) return;
    if (!force && nextHeight === lastHeight) return;

    lastHeight = nextHeight;

    window.parent.postMessage(
      {
        type: MESSAGE_TYPE,
        height: nextHeight,
        frameName: window.name || '',
        sourceUrl: window.location.href,
      },
      '*'
    );
  }

  function queuePost(force) {
    if (rafId) return;

    rafId = window.requestAnimationFrame(function () {
      rafId = 0;
      postHeight(Boolean(force));
    });
  }

  function initObservers() {
    if (typeof MutationObserver !== 'undefined') {
      var mutationObserver = new MutationObserver(function () {
        queuePost(false);
      });

      mutationObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      var resizeObserver = new ResizeObserver(function () {
        queuePost(false);
      });

      if (document.body) resizeObserver.observe(document.body);
      resizeObserver.observe(document.documentElement);
    }
  }

  function initEvents() {
    window.addEventListener('load', function () { queuePost(true); });
    window.addEventListener('resize', function () { queuePost(false); });
    window.addEventListener('orientationchange', function () { queuePost(false); });
    document.addEventListener('readystatechange', function () { queuePost(false); });

    ['transitionend', 'animationend'].forEach(function (eventName) {
      document.addEventListener(eventName, function () { queuePost(false); }, true);
    });

    window.setInterval(function () { queuePost(false); }, 1200);
  }

  function init() {
    initObservers();
    initEvents();

    queuePost(true);
    window.setTimeout(function () { queuePost(true); }, 120);
    window.setTimeout(function () { queuePost(true); }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
