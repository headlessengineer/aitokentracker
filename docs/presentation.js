/* AI Token Tracker - Presentation Runtime
 * Handles: navigation, theme, scroll mode, offcanvas, progress bar.
 * No dependencies. Include once per deck.
 */
(function () {
  'use strict';

  var THEME_KEY = 'he-presentation-theme';

  /* Restore persisted theme before first paint */
  var storedTheme = localStorage.getItem(THEME_KEY);
  if (storedTheme === 'light') {
    document.body.classList.remove('dark-mode');
  }

  var slides = [];
  var current = 0;
  var scrollMode = false;
  var ocOpen = false;
  var progressBar = null;

  /* ---- Navigation -------------------------------------------------- */

  function goTo(idx) {
    if (idx < 0 || idx >= slides.length) return;
    slides[current].classList.remove('active');
    current = idx;
    var slide = slides[current];
    restartAnimations(slide);
    slide.classList.add('active');
    if (progressBar) {
      progressBar.style.width = ((current + 1) / slides.length * 100) + '%';
    }
    updateOffcanvasActive();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  /* Reset CSS animations so they replay on re-visit */
  function restartAnimations(slide) {
    var els = slide.querySelectorAll('.animate-fade-up, .animate-scale');
    var stagger = slide.querySelectorAll('.animate-stagger > *');
    var all = Array.from(els).concat(Array.from(stagger));
    all.forEach(function (el) {
      el.style.animation = 'none';
      /* trigger reflow */
      void el.offsetHeight;
      el.style.animation = '';
    });
  }

  /* ---- Keyboard ---------------------------------------------------- */

  document.addEventListener('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next(); break;
      case 'ArrowLeft':
      case 'ArrowUp':
        prev(); break;
      case ' ':
        e.preventDefault();
        if (!scrollMode) next();
        break;
      case 't': case 'T': toggleTheme(); break;
      case 'p': case 'P': toggleScrollMode(); break;
      case 'o': case 'O': toggleOffcanvas(); break;
      case 'Escape': closeOffcanvas(); break;
    }
  });

  /* Click anywhere (except interactive elements) advances slide */
  document.addEventListener('click', function (e) {
    if (scrollMode) return;
    if (e.target.closest('button, a, .oc-panel')) return;
    next();
  });

  /* ---- Theme ------------------------------------------------------- */

  function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    var t = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, t);
  }

  /* ---- Scroll mode ------------------------------------------------- */

  function toggleScrollMode() {
    scrollMode = !scrollMode;
    document.body.classList.toggle('scroll-mode', scrollMode);
    if (scrollMode) {
      slides.forEach(function (s) { s.classList.add('active'); });
    } else {
      slides.forEach(function (s, i) {
        s.classList.toggle('active', i === current);
      });
    }
  }

  /* ---- Offcanvas --------------------------------------------------- */

  function buildOffcanvas() {
    var backdrop = document.createElement('div');
    backdrop.className = 'oc-backdrop';
    backdrop.id = 'ocBackdrop';
    backdrop.addEventListener('click', closeOffcanvas);

    var panel = document.createElement('div');
    panel.className = 'oc-panel';
    panel.id = 'ocPanel';
    panel.innerHTML =
      '<div class="oc-header">' +
        '<span class="oc-wordmark">' +
          '<span class="oc-wm-head">HEADLESS</span>' +
          '<span class="oc-wm-eng">ENGINEER</span>' +
        '</span>' +
        '<div class="oc-header-actions">' +
          '<button class="oc-icon-btn" id="ocClose" aria-label="Close">' +
            '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<nav class="oc-nav"><ul class="oc-slide-list" id="ocList"></ul></nav>' +
      '<div class="oc-footer"><span class="oc-hint">O &ndash; nav &nbsp;|&nbsp; T &ndash; theme &nbsp;|&nbsp; P &ndash; scroll &nbsp;|&nbsp; &larr;&rarr; &ndash; move</span></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    document.getElementById('ocClose').addEventListener('click', closeOffcanvas);

    buildSlideList();
  }

  function buildSlideList() {
    var list = document.getElementById('ocList');
    if (!list) return;
    list.innerHTML = '';
    var lastSection = '';

    slides.forEach(function (slide, i) {
      var title = slide.dataset.slideTitle || ('Slide ' + (i + 1));
      var section = slide.dataset.slideSection || '';

      if (section && section !== lastSection) {
        var secEl = document.createElement('li');
        secEl.style.cssText = 'padding:12px 12px 4px;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--primary);';
        secEl.textContent = section;
        list.appendChild(secEl);
        lastSection = section;
      }

      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.className = 'oc-slide-btn' + (i === current ? ' oc-slide-active' : '');
      btn.dataset.idx = i;
      btn.innerHTML =
        '<span class="oc-slide-num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="oc-slide-info">' +
          (section ? '<span class="oc-slide-section">' + section + '</span>' : '') +
          '<span class="oc-slide-title-text">' + title + '</span>' +
        '</span>';
      btn.addEventListener('click', (function (idx) {
        return function () { goTo(idx); closeOffcanvas(); };
      }(i)));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function updateOffcanvasActive() {
    var list = document.getElementById('ocList');
    if (!list) return;
    list.querySelectorAll('.oc-slide-btn').forEach(function (btn) {
      btn.classList.toggle('oc-slide-active', parseInt(btn.dataset.idx) === current);
    });
  }

  function openOffcanvas() {
    ocOpen = true;
    document.getElementById('ocBackdrop').classList.add('oc-backdrop--open');
    document.getElementById('ocPanel').classList.add('oc-panel--open');
  }

  function closeOffcanvas() {
    ocOpen = false;
    var bd = document.getElementById('ocBackdrop');
    var pn = document.getElementById('ocPanel');
    if (bd) bd.classList.remove('oc-backdrop--open');
    if (pn) pn.classList.remove('oc-panel--open');
  }

  function toggleOffcanvas() {
    if (ocOpen) closeOffcanvas(); else openOffcanvas();
  }

  /* ---- Init -------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    slides = Array.from(document.querySelectorAll('.slide'));
    progressBar = document.getElementById('progressBar');
    buildOffcanvas();
    goTo(0);
  });

}());
