(function () {
  'use strict';

  var SPLIDE_CSS_URL = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css';
  var SPLIDE_JS_URL = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js';

  var STYLE_ID = 'ib-tutorial-carousel-style';
  var CSS_LINK_ID = 'ib-splide-css';
  var SCRIPT_ID = 'ib-splide-js';
  var FALLBACK_TARGET_CLASS = 'ib-tutorial-fallback-target';
  var LOG_PREFIX = '[IBCarouselInjector]';

  var splideInstance = null;
  var activeGhost = null;
  var modalHandlersBound = false;
  var debugEnabled = false;

  function setDebug(value) {
    debugEnabled = !!value;
  }

  function log() {
    if (!debugEnabled) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift(LOG_PREFIX);
    console.log.apply(console, args);
  }

  function logError() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(LOG_PREFIX);
    console.error.apply(console, args);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '.ib-tutorial-wrapper { display:flex; align-items:center; justify-content:center; background-color:#000; padding:75px 0; }',
      '.ib-tutorial-container { display:flex; flex-direction:column; gap:80px; justify-content:center; align-items:center; width:100%; }',
      '.ib-tutorial-header { display:flex; align-items:center; gap:24px; }',
      '.ib-tutorial-title { font-family:"Special Gothic Expanded One",sans-serif; font-weight:400; font-size:45px; line-height:110%; color:#fff; text-align:center; user-select:none; margin:0; }',
      '.ib-tutorial-carrousel-wrapper { width:100%; max-width:1280px; background-color:#fff; border-radius:20px; display:flex; flex-direction:column; align-items:center; padding:75px 46px; gap:46px; position:relative; overflow:hidden; box-sizing:border-box; }',
      '.ib-tutorial-carrousel-container { position:relative; display:flex; width:100%; align-items:center; justify-content:center; gap:32px; overflow:hidden; }',
      '#ib-tutorial-carrousel { width:1100px; max-width:1100px; overflow:hidden; }',
      '#ib-tutorial-carrousel .splide__track { overflow:hidden; }',
      '.ib-side-arrow { cursor:pointer; transition:opacity .3s ease; user-select:none; }',
      '.ib-side-arrow:hover { opacity:.7; }',
      '.ib-side-arrow.ib-right { transform:rotate(180deg); }',
      '.ib-carrousel-item { width:100%; height:200px; border-radius:10px; overflow:hidden; cursor:pointer; }',
      '.ib-carrousel-item img { width:100%; height:100%; object-fit:cover; transition:transform .3s ease, filter .3s ease; display:block; }',
      '.ib-carrousel-item:hover img { transform:scale(1.05); filter:brightness(1.2); }',
      '.ib-view-all-button { width:fit-content; height:67px; background:linear-gradient(189.67deg, rgba(72,74,87,.6) 28.65%, rgba(15,15,17,.6) 81.82%), #252528; border:1.39583px solid #484A57; border-radius:51px; padding:0 45px; display:flex; align-items:center; justify-content:center; font-family:"Special Gothic Expanded One",sans-serif; color:#fff; transition:opacity .3s ease; cursor:pointer; text-decoration:none; user-select:none; }',
      '.ib-view-all-button:hover { opacity:.7; }',
      '.ib-video-modal { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.65); opacity:0; visibility:hidden; pointer-events:none; transition:opacity .25s ease, visibility .25s ease; z-index:9999; padding:24px; box-sizing:border-box; }',
      '.ib-video-modal.is-open { opacity:1; visibility:visible; pointer-events:auto; }',
      '.ib-video-modal-card { position:relative; width:min(960px, 92vw); aspect-ratio:16/9; border-radius:16px; overflow:hidden; background:#000; box-shadow:0 30px 80px rgba(0,0,0,.45); transform:scale(.98); opacity:0; transition:transform .2s ease, opacity .2s ease; }',
      '.ib-video-modal.is-ready .ib-video-modal-card { transform:scale(1); opacity:1; }',
      '.ib-video-modal-close { position:absolute; top:12px; right:12px; width:40px; height:40px; border-radius:999px; border:0; background:rgba(0,0,0,.55); color:#fff; font-size:28px; line-height:1; cursor:pointer; z-index:2; }',
      '.ib-video-modal-player { width:100%; height:100%; object-fit:contain; background:#000; }',
      '.ib-video-modal-ghost { position:fixed; margin:0; z-index:10000; pointer-events:none; overflow:hidden; transform-origin:center center; transition:all .34s cubic-bezier(.2,.8,.2,1); }',
      '.ib-video-modal-ghost img { width:100%; height:100%; object-fit:cover; display:block; }',
      'body.ib-modal-open { overflow:hidden; }',
      '@media (max-width:1279px) and (min-width:479px) {',
      '.ib-tutorial-wrapper { padding:56px 0; }',
      '.ib-tutorial-container { gap:48px; }',
      '.ib-tutorial-title { font-size:34px; }',
      '.ib-tutorial-carrousel-wrapper { padding:56px 24px; gap:32px; }',
      '.ib-tutorial-carrousel-container { gap:20px; }',
      '#ib-tutorial-carrousel { width:728px; max-width:728px; }',
      '}',
      '@media (max-width:478px) {',
      '.ib-tutorial-wrapper { padding:40px 0; }',
      '.ib-tutorial-container { gap:32px; }',
      '.ib-tutorial-title { font-size:26px; }',
      '.ib-tutorial-carrousel-wrapper { border-radius:14px; padding:36px 14px; gap:24px; }',
      '.ib-tutorial-carrousel-container { gap:12px; }',
      '#ib-tutorial-carrousel { width:calc(100vw - 88px); max-width:calc(100vw - 88px); }',
      '.ib-carrousel-item { height:180px; }',
      '.ib-side-arrow svg { width:16px; height:30px; }',
      '.ib-view-all-button { height:54px; padding:0 24px; font-size:14px; }',
      '}'
    ].join('\n');

    document.head.appendChild(style);
    log('Styles injected');
  }

  function ensureSplideCss() {
    if (document.getElementById(CSS_LINK_ID)) return;

    var link = document.createElement('link');
    link.id = CSS_LINK_ID;
    link.rel = 'stylesheet';
    link.href = SPLIDE_CSS_URL;
    document.head.appendChild(link);
    log('Splide CSS appended', SPLIDE_CSS_URL);
  }

  function ensureSplideJs() {
    if (window.Splide) {
      log('Splide JS already available');
      return Promise.resolve();
    }

    var existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      log('Waiting for existing Splide JS script to load');
      return new Promise(function (resolve, reject) {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
      });
    }

    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SPLIDE_JS_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
      log('Splide JS appended', SPLIDE_JS_URL);
    });
  }

  function escapeHtmlAttr(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeHtmlText(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function normalizeMessageData(rawData) {
    var parsed = rawData;

    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch (error) {
        parsed = null;
      }
    }

    if (Array.isArray(parsed)) {
      return {
        targetClass: null,
        items: parsed,
        title: 'Capacitate en linea con nuestros tutoriales',
        viewAllUrl: 'https://www.ibcampus.com.ar/capacitate-en-ib',
        viewAllText: 'ver todos'
      };
    }

    if (!parsed || typeof parsed !== 'object') {
      return {
        targetClass: null,
        items: [],
        title: 'Capacitate en linea con nuestros tutoriales',
        viewAllUrl: 'https://www.ibcampus.com.ar/capacitate-en-ib',
        viewAllText: 'ver todos'
      };
    }

    var items = Array.isArray(parsed.items)
      ? parsed.items
      : Array.isArray(parsed.data)
        ? parsed.data
        : Array.isArray(parsed.payload)
          ? parsed.payload
          : [];

    return {
      targetClass: typeof parsed.targetClass === 'string' ? parsed.targetClass.trim() : null,
      items: items,
      title: typeof parsed.title === 'string' && parsed.title.trim()
        ? parsed.title.trim()
        : 'Capacitate en linea con nuestros tutoriales',
      viewAllUrl: typeof parsed.viewAllUrl === 'string' && parsed.viewAllUrl.trim()
        ? parsed.viewAllUrl.trim()
        : 'https://www.ibcampus.com.ar/capacitate-en-ib',
      viewAllText: typeof parsed.viewAllText === 'string' && parsed.viewAllText.trim()
        ? parsed.viewAllText.trim()
        : 'ver todos'
    };
  }

  function getTargetContainer(targetClass) {
    if (targetClass) {
      var className = targetClass.charAt(0) === '.' ? targetClass.slice(1) : targetClass;
      var found = document.querySelector('.' + className);
      if (found) {
        log('Target class found', className);
        return found;
      }
      log('Target class not found, using body fallback', className);
    }

    var fallback = document.createElement('div');
    fallback.className = FALLBACK_TARGET_CLASS;
    document.body.appendChild(fallback);
    log('Fallback target appended at end of body');
    return fallback;
  }

  function getCarouselHtml(title, viewAllUrl, viewAllText) {
    return [
      '<div class="ib-tutorial-wrapper">',
      '  <div class="ib-tutorial-container">',
      '    <div class="ib-tutorial-header">',
      '      <h2 class="ib-tutorial-title">' + escapeHtmlText(title) + '</h2>',
      '      <svg width="32" height="19" viewBox="0 0 32 19" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '        <path d="M1.45312 1.45312L15.9797 16.6781L30.5063 1.45313" stroke="white" stroke-width="2.90532" stroke-linecap="round" stroke-linejoin="round"></path>',
      '      </svg>',
      '    </div>',
      '    <div class="ib-tutorial-carrousel-wrapper">',
      '      <div class="ib-tutorial-carrousel-container">',
      '        <div class="ib-side-arrow ib-left" aria-label="Previous">',
      '          <svg width="21" height="40" viewBox="0 0 21 40" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '            <path d="M19.9375 0.914062L0.912694 19.9389L19.9375 38.9637" stroke="black" stroke-width="1.82755" stroke-linecap="round" stroke-linejoin="round"></path>',
      '          </svg>',
      '        </div>',
      '        <section id="ib-tutorial-carrousel" class="splide" aria-label="Tutorial Carousel">',
      '          <div class="splide__track">',
      '            <ul class="splide__list"></ul>',
      '          </div>',
      '        </section>',
      '        <div class="ib-side-arrow ib-right" aria-label="Next">',
      '          <svg width="21" height="40" viewBox="0 0 21 40" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '            <path d="M19.9375 0.914062L0.912694 19.9389L19.9375 38.9637" stroke="black" stroke-width="1.82755" stroke-linecap="round" stroke-linejoin="round"></path>',
      '          </svg>',
      '        </div>',
      '      </div>',
      '      <a href="' + escapeHtmlAttr(viewAllUrl) + '" target="_blank" rel="noopener noreferrer" class="ib-view-all-button">' + escapeHtmlText(viewAllText) + '</a>',
      '    </div>',
      '  </div>',
      '</div>',
      '<div id="ib-video-modal" class="ib-video-modal" aria-hidden="true">',
      '  <div class="ib-video-modal-card" role="dialog" aria-modal="true" aria-label="Video player popup">',
      '    <button id="ib-video-modal-close" class="ib-video-modal-close" aria-label="Cerrar video">&times;</button>',
      '    <video id="ib-video-modal-player" class="ib-video-modal-player" controls playsinline></video>',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  function renderSlides(items) {
    var list = document.querySelector('#ib-tutorial-carrousel .splide__list');
    if (!list) return;

    var safeItems = Array.isArray(items) ? items : [];
    list.innerHTML = safeItems.map(function (item) {
      var imageUrl = (item && (item.miniatura || item.portada || item.imagenDestacada)) || '';
      var videoUrl = (item && item.r2MediaUrl) || '';
      var title = (item && (item.tituloMiniatura || item.title || item.subtituloMiniatura || item.subtitulo)) || '';

      return [
        '<li class="splide__slide">',
        '  <div class="ib-carrousel-item" data-video-url="' + escapeHtmlAttr(videoUrl) + '">',
        '    <img src="' + escapeHtmlAttr(imageUrl) + '" alt="' + escapeHtmlAttr(title) + '" />',
        '  </div>',
        '</li>'
      ].join('\n');
    }).join('');

    log('Slides rendered', safeItems.length);
  }

  function openVideoModalFromItem(itemElement, videoUrl) {
    if (!itemElement || !videoUrl) return;

    var modal = document.getElementById('ib-video-modal');
    var modalCard = modal ? modal.querySelector('.ib-video-modal-card') : null;
    var videoPlayer = document.getElementById('ib-video-modal-player');

    if (!modal || !modalCard || !videoPlayer) return;

    var sourceImage = itemElement.querySelector('img');
    modal.classList.add('is-open');
    modal.classList.remove('is-ready');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ib-modal-open');

    var startRect = itemElement.getBoundingClientRect();
    var endRect = modalCard.getBoundingClientRect();

    if (activeGhost) {
      activeGhost.remove();
      activeGhost = null;
    }

    if (sourceImage) {
      var ghost = document.createElement('div');
      ghost.className = 'ib-video-modal-ghost';
      ghost.style.left = startRect.left + 'px';
      ghost.style.top = startRect.top + 'px';
      ghost.style.width = startRect.width + 'px';
      ghost.style.height = startRect.height + 'px';
      ghost.style.borderRadius = '10px';
      ghost.innerHTML = '<img src="' + escapeHtmlAttr(sourceImage.src) + '" alt="" />';
      document.body.appendChild(ghost);
      activeGhost = ghost;

      requestAnimationFrame(function () {
        ghost.style.left = endRect.left + 'px';
        ghost.style.top = endRect.top + 'px';
        ghost.style.width = endRect.width + 'px';
        ghost.style.height = endRect.height + 'px';
        ghost.style.borderRadius = '16px';
      });

      ghost.addEventListener('transitionend', function () {
        modal.classList.add('is-ready');
        videoPlayer.src = videoUrl;
        videoPlayer.play().catch(function () {});
        ghost.remove();
        if (activeGhost === ghost) activeGhost = null;
      }, { once: true });

      return;
    }

    modal.classList.add('is-ready');
    videoPlayer.src = videoUrl;
    videoPlayer.play().catch(function () {});
  }

  function closeVideoModal() {
    var modal = document.getElementById('ib-video-modal');
    var videoPlayer = document.getElementById('ib-video-modal-player');
    if (!modal || !videoPlayer) return;

    modal.classList.remove('is-open', 'is-ready');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ib-modal-open');

    videoPlayer.pause();
    videoPlayer.removeAttribute('src');
    videoPlayer.load();

    if (activeGhost) {
      activeGhost.remove();
      activeGhost = null;
    }
  }

  function setupModalHandlers() {
    if (modalHandlersBound) return;

    var modal = document.getElementById('ib-video-modal');
    var closeButton = document.getElementById('ib-video-modal-close');
    if (!modal || !closeButton) return;

    closeButton.addEventListener('click', closeVideoModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeVideoModal();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeVideoModal();
    });

    modalHandlersBound = true;
  }

  function bindCardClick() {
    var list = document.querySelector('#ib-tutorial-carrousel .splide__list');
    if (!list) return;

    list.onclick = function (event) {
      var card = event.target.closest('.ib-carrousel-item');
      if (!card) return;

      var videoUrl = card.getAttribute('data-video-url');
      if (!videoUrl) return;

      openVideoModalFromItem(card, videoUrl);
    };
  }

  function mountSplide() {
    if (!window.Splide) {
      throw new Error('Splide is not loaded');
    }

    if (splideInstance) {
      splideInstance.destroy(true);
      splideInstance = null;
    }

    splideInstance = new window.Splide('#ib-tutorial-carrousel', {
      type: 'slide',
      perPage: 3,
      perMove: 1,
      autoplay: false,
      pagination: false,
      arrows: false,
      autoWidth: false,
      gap: '16px',
      breakpoints: {
        1279: { perPage: 2, perMove: 1 },
        900: { perPage: 1, perMove: 1 }
      }
    });

    splideInstance.mount();
    log('Splide mounted');

    var leftArrow = document.querySelector('.ib-side-arrow.ib-left');
    var rightArrow = document.querySelector('.ib-side-arrow.ib-right');

    if (leftArrow) {
      leftArrow.onclick = function () {
        splideInstance.go('<');
      };
    }

    if (rightArrow) {
      rightArrow.onclick = function () {
        splideInstance.go('>');
      };
    }
  }

  function handleIncomingMessage(event) {
    log('Message received', {
      origin: event.origin || 'unknown',
      dataType: Array.isArray(event.data) ? 'array' : typeof event.data
    });

    var normalized = normalizeMessageData(event.data);
    log('Message normalized', {
      targetClass: normalized.targetClass || '(none)',
      items: normalized.items.length
    });

    if (!normalized.items.length) {
      log('No items found, aborting render');
      return Promise.resolve(false);
    }

    ensureStyles();
    ensureSplideCss();

    // Step 2: inject HTML with innerHTML into the target.
    var target = getTargetContainer(normalized.targetClass);
    target.innerHTML = getCarouselHtml(normalized.title, normalized.viewAllUrl, normalized.viewAllText);
    log('Carousel HTML injected via innerHTML');

    renderSlides(normalized.items);
    setupModalHandlers();
    bindCardClick();
    log('Handlers bound');

    // Step 3: mount Splide after injection.
    return ensureSplideJs().then(function () {
      mountSplide();
      log('Render flow completed');
      return true;
    });
  }

  function init() {
    window.addEventListener('message', function (event) {
      handleIncomingMessage(event).catch(function (error) {
        logError('Carousel injection failed:', error);
      });
    });

    log('Injector initialized');
  }

  init();

  // Optional API for manual triggering/debug.
  window.IBCarouselInjector = {
    handleIncomingMessage: handleIncomingMessage,
    setDebug: setDebug,
    version: '1.0.0'
  };

  if (window.IBCarouselInjectorDebug === true) {
    setDebug(true);
    log('Debug mode enabled from window.IBCarouselInjectorDebug');
  }
})();
