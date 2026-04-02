/* ===============================
   cases.js — Cases page logic
   - Before/after image toggle
   - Lightbox (full carousel per case)
   - Per-case fullscreen bg parallax
   - Image slide-in animation
   =============================== */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---- Carousel data (full set for lightbox) ---- */
  const CAROUSELS = {
    1: ['case1-1after.jpg','case1-2after.jpg','case1-3after.jpg','case1-4.jpg','case1-5.jpg','case1-6.jpg'],
    2: ['case2-0.jpg','case2-1after.jpg','case2-2after.jpg','case2-3after.jpg','case2-4.jpg','case2-5.jpg'],
    3: ['case3-1.jpg','case3-2.jpg','case3-3.jpg','case3-4.jpg'],
    4: ['case4-1after.jpg','case4-2.jpg','case4-3.jpg','case4-4.jpg','case4-5.jpg'],
    5: ['case5-1.jpg','case5-2.jpg','case5-3after.jpg','case5-4.jpg','case5-5.jpg'],
    6: ['case6-1.jpg','case6-2.jpg','case6-3after.jpg','case6-4.jpg','case6-5.jpg'],
  };

  /* ---- Lightbox ---- */
  const lightbox = $('#lightbox');
  const lbImg = lightbox ? $('.lightbox__img', lightbox) : null;
  const btnClose = lightbox ? $('.lightbox__close', lightbox) : null;
  const btnPrev = lightbox ? $('.lightbox__prev', lightbox) : null;
  const btnNext = lightbox ? $('.lightbox__next', lightbox) : null;

  let currentList = [];
  let currentIndex = 0;
  let lastActiveEl = null;

  const filename = (src) => {
    try {
      const u = new URL(src, window.location.href);
      return u.pathname.split('/').pop() || '';
    } catch {
      return (src || '').split('/').pop() || '';
    }
  };

  function resolveStartIndex(caseId, clickedImg) {
    const files = CAROUSELS[caseId] || [];
    const clickName = filename(clickedImg?.src || '');
    const afterCandidate = clickName.replace('before', 'after');
    let preferred = clickName;
    if (clickedImg?.classList.contains('before') && files.includes(afterCandidate)) {
      preferred = afterCandidate;
    } else if (files.includes(afterCandidate)) {
      preferred = afterCandidate;
    }
    let idx = files.findIndex((f) => f === preferred);
    if (idx === -1) idx = files.findIndex((f) => f === clickName);
    return Math.max(idx, 0);
  }

  function renderLightbox() {
    if (!lbImg) return;
    // Use absolute path so images resolve correctly from any page URL
    lbImg.src = '/' + currentList[currentIndex];
    lbImg.alt = '';
  }

  function openLightbox(caseId, clickedImg) {
    const files = CAROUSELS[caseId];
    if (!files || files.length === 0) return;
    currentList = files.slice(0);
    currentIndex = resolveStartIndex(caseId, clickedImg);
    lastActiveEl = document.activeElement;
    renderLightbox();
    lightbox?.classList.add('open');
    lightbox?.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    btnClose?.focus();
  }

  function closeLightbox() {
    lightbox?.classList.remove('open');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastActiveEl && typeof lastActiveEl.focus === 'function') lastActiveEl.focus();
    if (lbImg) lbImg.src = '';
    currentList = [];
    currentIndex = 0;
  }

  function next() {
    if (!currentList.length) return;
    currentIndex = (currentIndex + 1) % currentList.length;
    renderLightbox();
  }
  function prev() {
    if (!currentList.length) return;
    currentIndex = (currentIndex - 1 + currentList.length) % currentList.length;
    renderLightbox();
  }

  btnClose?.addEventListener('click', closeLightbox);
  btnNext?.addEventListener('click', next);
  btnPrev?.addEventListener('click', prev);
  lightbox?.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  /* ---- Before/after toggle ---- */
  $$('figure.before-after').forEach((fig) => {
    if (!fig.hasAttribute('tabindex')) fig.setAttribute('tabindex', '0');
    if (!fig.hasAttribute('role')) fig.setAttribute('role', 'button');
    fig.setAttribute('aria-pressed', fig.classList.contains('toggled') ? 'true' : 'false');

    // Create undo button
    let reverseBtn = $('.reverse-btn', fig);
    if (!reverseBtn) {
      reverseBtn = document.createElement('button');
      reverseBtn.type = 'button';
      reverseBtn.className = 'reverse-btn';
      reverseBtn.setAttribute('aria-label', 'Показать «до»');
      reverseBtn.innerHTML = '<img src="/undo.png" width="18" height="18" alt="" aria-hidden="true">';
      fig.appendChild(reverseBtn);
      reverseBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        fig.classList.remove('toggled');
        fig.setAttribute('aria-pressed', 'false');
        reverseBtn.blur();
      });
      reverseBtn.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          fig.classList.remove('toggled');
          fig.setAttribute('aria-pressed', 'false');
        }
      });
    }

    const toggle = () => {
      fig.classList.toggle('toggled');
      fig.setAttribute('aria-pressed', fig.classList.contains('toggled') ? 'true' : 'false');
    };

    const attemptOpenAfter = () => {
      const article = fig.closest('article.case');
      const caseId = parseInt(article?.getAttribute('data-case') || '0', 10);
      if (!caseId) return;
      const afterImg = $('.after', fig) || $('img', fig);
      openLightbox(caseId, afterImg);
    };

    fig.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (!fig.classList.contains('toggled')) { toggle(); return; }
      attemptOpenAfter();
    });

    fig.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        if (!fig.classList.contains('toggled')) { toggle(); } else { attemptOpenAfter(); }
      }
    });
  });

  // Non-before/after images in cases → open lightbox on click
  $$('article.case').forEach((article) => {
    const caseId = parseInt(article.getAttribute('data-case') || '0', 10);
    if (!caseId) return;
    article.addEventListener('click', (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.closest('.before-after')) return;
      const targetImg = e.target.closest('img');
      if (!targetImg) return;
      openLightbox(caseId, targetImg);
    });
  });

  /* ---- Per-case fullscreen correlated background ---- */
  const caseArticles = $$('article.case');
  let activeCase = null;

  function updateActiveCase() {
    const mid = (window.innerHeight || 0) / 2;
    let nextActive = null;
    for (const art of caseArticles) {
      const r = art.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { nextActive = art; break; }
    }
    if (activeCase !== nextActive) {
      if (activeCase) activeCase.classList.remove('active');
      if (nextActive) nextActive.classList.add('active');
      activeCase = nextActive;
    }
  }

  function updateCaseBgShift() {
    const shift = Math.sin(window.scrollY / 250) * 24;
    document.documentElement.style.setProperty('--case-bg-shift', shift.toFixed(2) + 'px');
  }

  window.addEventListener('scroll', () => { updateActiveCase(); updateCaseBgShift(); }, { passive: true });
  window.addEventListener('resize', updateActiveCase, { passive: true });
  window.addEventListener('load', () => { updateActiveCase(); updateCaseBgShift(); });

})();
