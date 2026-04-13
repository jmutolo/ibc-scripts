(function () {
  'use strict';

  const SECTION_SELECTORS = [
    '.capacitate-section',
    '.mas-vistos-section',
    '.esta-semana-section',
    '.podcasts-section',
    '.actualidad-section',
  ];

  const managedSections = new Map();
  let domObserver = null;

  function toInt(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }

  function applySectionHeight(section, height) {
    const nextHeight = toInt(height);
    if (nextHeight <= 0) return;

    section.style.minHeight = nextHeight + 'px';
  }

  function getIframeElementHeight(iframe) {
    if (!iframe) return 0;

    const rectHeight = iframe.getBoundingClientRect().height;
    if (rectHeight > 0) return rectHeight;

    return iframe.offsetHeight || 0;
  }

  function getIframeContentHeight(iframe) {
    if (!iframe || !iframe.contentWindow) return 0;

    try {
      const doc = iframe.contentWindow.document;
      if (!doc) return 0;

      const body = doc.body;
      const html = doc.documentElement;
      if (!body || !html) return 0;

      return Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.scrollHeight,
        html.offsetHeight,
        html.clientHeight
      );
    } catch (_) {
      return 0;
    }
  }

  function updateSection(section) {
    const iframe = section.querySelector('iframe');
    if (!iframe) return;

    const elementHeight = getIframeElementHeight(iframe);
    const contentHeight = getIframeContentHeight(iframe);
    const nextHeight = Math.max(elementHeight, contentHeight);

    applySectionHeight(section, nextHeight);
  }

  function parseIframeResizerHeight(data) {
    if (typeof data !== 'string' || data.indexOf('[iFrameSizer]') !== 0) {
      return 0;
    }

    const match = data.match(/\[iFrameSizer\][^:]*:(\d+):/);
    if (!match) return 0;

    return toInt(match[1]);
  }

  function handlePostMessage(event) {
    const parsedHeight = parseIframeResizerHeight(event.data);
    if (parsedHeight <= 0) return;

    managedSections.forEach((meta, section) => {
      if (!meta.iframe || !meta.iframe.contentWindow) return;

      if (event.source === meta.iframe.contentWindow) {
        applySectionHeight(section, parsedHeight);
      }
    });
  }

  function watchIframe(section, iframe) {
    const resizeObserver = new ResizeObserver(function () {
      updateSection(section);
    });

    resizeObserver.observe(iframe);

    const onLoad = function () {
      updateSection(section);
    };

    iframe.addEventListener('load', onLoad);

    managedSections.set(section, {
      iframe,
      resizeObserver,
      onLoad,
    });

    updateSection(section);
  }

  function unwatchSection(section) {
    const meta = managedSections.get(section);
    if (!meta) return;

    if (meta.resizeObserver) {
      meta.resizeObserver.disconnect();
    }

    if (meta.iframe && meta.onLoad) {
      meta.iframe.removeEventListener('load', meta.onLoad);
    }

    managedSections.delete(section);
  }

  function collectSections() {
    const selector = SECTION_SELECTORS.join(',');
    return Array.from(document.querySelectorAll(selector));
  }

  function scanAndAttach() {
    const sections = collectSections();
    const active = new Set(sections);

    sections.forEach((section) => {
      const iframe = section.querySelector('iframe');
      if (!iframe) return;

      const known = managedSections.get(section);
      if (known && known.iframe === iframe) {
        updateSection(section);
        return;
      }

      if (known) {
        unwatchSection(section);
      }

      watchIframe(section, iframe);
    });

    Array.from(managedSections.keys()).forEach((section) => {
      if (!active.has(section)) {
        unwatchSection(section);
      }
    });
  }

  function initObservers() {
    if (domObserver) return;

    domObserver = new MutationObserver(function () {
      scanAndAttach();
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'src', 'class'],
    });
  }

  function init() {
    if (typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') {
      scanAndAttach();
      return;
    }

    scanAndAttach();
    initObservers();
    window.addEventListener('message', handlePostMessage);
    window.addEventListener('resize', scanAndAttach);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
