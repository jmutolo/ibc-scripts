(function () {
  'use strict';

  var MESSAGE_TYPE = 'IBC_IFRAME_HEIGHT';
  var TARGET_SECTION_SELECTORS = [
    '.capacitate-section',
    '.mas-vistos-section',
    '.esta-semana-section',
    '.podcasts-section',
    '.actualidad-section',
  ];

  var pendingByIframe = new Map();

  function toInt(value) {
    var n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  function setStrictHeight(element, pxValue) {
    if (!element || !pxValue) return;

    element.style.setProperty('height', pxValue, 'important');
    element.style.setProperty('min-height', pxValue, 'important');
    element.style.setProperty('max-height', pxValue, 'important');
  }

  function findIframeByMessageSource(sourceWindow, frameName) {
    var iframes = document.querySelectorAll('iframe');

    for (var i = 0; i < iframes.length; i += 1) {
      var iframe = iframes[i];
      if (iframe.contentWindow === sourceWindow) {
        return iframe;
      }
    }

    if (!frameName) {
      return null;
    }

    for (var j = 0; j < iframes.length; j += 1) {
      var namedFrame = iframes[j];
      if (namedFrame.name === frameName) {
        return namedFrame;
      }
    }

    return null;
  }

  function isTargetSection(element) {
    if (!element || !element.matches) return false;

    for (var i = 0; i < TARGET_SECTION_SELECTORS.length; i += 1) {
      if (element.matches(TARGET_SECTION_SELECTORS[i])) {
        return true;
      }
    }

    return false;
  }

  function applyHeightToAncestors(iframe, pxValue) {
    setStrictHeight(iframe, pxValue);

    var node = iframe.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      if (node.tagName && node.tagName.toLowerCase() === 'div') {
        setStrictHeight(node, pxValue);
      }

      if (isTargetSection(node)) {
        setStrictHeight(node, pxValue);
        node.style.setProperty('--iframe-section-height', pxValue, 'important');
        break;
      }

      node = node.parentElement;
    }
  }

  function flushIframeHeight(iframe, height) {
    var pxValue = toInt(height) + 'px';
    applyHeightToAncestors(iframe, pxValue);
  }

  function scheduleHeightApply(iframe, height) {
    if (!iframe) return;

    var pending = pendingByIframe.get(iframe);
    if (pending && pending.rafId) {
      pending.height = height;
      pendingByIframe.set(iframe, pending);
      return;
    }

    var state = {
      height: height,
      rafId: window.requestAnimationFrame(function () {
        var latest = pendingByIframe.get(iframe);
        pendingByIframe.delete(iframe);
        if (!latest) return;
        flushIframeHeight(iframe, latest.height);
      }),
    };

    pendingByIframe.set(iframe, state);
  }

  function handleMessage(event) {
    var data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type !== MESSAGE_TYPE) return;

    var height = toInt(data.height);
    if (height <= 0) return;

    var iframe = findIframeByMessageSource(event.source, data.frameName || '');
    if (!iframe) return;

    scheduleHeightApply(iframe, height);
  }

  window.addEventListener('message', handleMessage);
})();
