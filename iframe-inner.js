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
    var doc = document;
    var body = doc.body;
    var html = doc.documentElement;

    if (!body || !html) {
      return 0;
    }

    return Math.max(
      body.scrollHeight,
      body.offsetHeight,
      body.clientHeight,
      html.scrollHeight,
      html.offsetHeight,
      html.clientHeight
    );
  }

  function postHeight(force) {
    if (!window.parent || window.parent === window) {
      return;
    }

    var nextHeight = toInt(getDocumentHeight());
    if (!force && nextHeight <= 0) {
      return;
    }

    if (!force && nextHeight === lastHeight) {
      return;
    }

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
    if (rafId) {
      return;
    }

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

      if (document.body) {
        resizeObserver.observe(document.body);
      }
      resizeObserver.observe(document.documentElement);
    }
  }

  function initEvents() {
    window.addEventListener('load', function () {
      queuePost(true);
    });

    window.addEventListener('resize', function () {
      queuePost(false);
    });

    window.addEventListener('orientationchange', function () {
      queuePost(false);
    });

    document.addEventListener('readystatechange', function () {
      queuePost(false);
    });

    var trackedEvents = ['transitionend', 'animationend'];
    trackedEvents.forEach(function (eventName) {
      document.addEventListener(
        eventName,
        function () {
          queuePost(false);
        },
        true
      );
    });

    window.setInterval(function () {
      queuePost(false);
    }, 1200);
  }

  function init() {
    initObservers();
    initEvents();

    queuePost(true);
    window.setTimeout(function () {
      queuePost(true);
    }, 120);
    window.setTimeout(function () {
      queuePost(true);
    }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
