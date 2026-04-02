(function(){
  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

  const isInAppWebView = () => {
    const ua = navigator.userAgent || navigator.vendor || '';
    return /Instagram|FBAN|FBAV|Line|WeChat|MiuiBrowser|Telegram/i.test(ua);
  };

  const applyInAppOffsets = () => {
    const root = document.documentElement;
    const cta = $('#cta-floating');

    let ctaBottom = 64;
    if (cta) {
      const r = cta.getBoundingClientRect();
      ctaBottom = Math.max(48, Math.ceil(r.bottom));
    }

    root.style.setProperty('--cta-bottom', ctaBottom + 'px');
    root.style.setProperty('--logo-top', (ctaBottom + 8) + 'px');
    root.style.setProperty('--process-h2-top', (ctaBottom + 12) + 'px');
    root.style.setProperty('--step-sticky-top', (ctaBottom + 68) + 'px');

    window.dispatchEvent(new Event('resize'));
    window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event('scroll'));
    });
  };

  const scrollToEl = (el) => {
    if(!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cta = $('#cta-floating');
  cta?.addEventListener('click', () => scrollToEl($('#contact')));

  const contact = $('#contact');
  if (contact && cta) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) cta.classList.add('hide');
          else cta.classList.remove('hide');
        });
      },
      { rootMargin: '0px 0px -20% 0px', threshold: 0.05 }
    );
    io.observe(contact);
  }

  $('#scroll-next')?.addEventListener('click', () => scrollToEl($('#process')));

  const heroCase2 = $('#hero-case2');
  const case2El = $('#case-2');
  if (heroCase2 && case2El) {
    const goToCase2 = () => scrollToEl(case2El);
    heroCase2.addEventListener('click', goToCase2);
    heroCase2.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goToCase2();
      }
    });
  }

  const revealIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -10% 0px' }
  );
  $$('.reveal').forEach((el) => revealIO.observe(el));

  const stack = $('#process-stack');
  let stickyTopVal = 72;
  if (stack) {
    const cards = $$('.step-card', stack);
    const countAttr = parseInt(stack.getAttribute('data-card-count') || cards.length, 10);
    const count = Math.max(countAttr, cards.length);

    const setStackHeight = () => {
      const vh = Math.max(window.innerHeight || 0, 600);
      const lastCard = cards[cards.length - 1];
      const lastCardHeight = lastCard?.offsetHeight || vh;
      const stickyTop = parseFloat(getComputedStyle(cards[0]).top) || Math.max(vh * 0.12, 72);
      stickyTopVal = stickyTop;
      const perCard = Math.min(Math.max(vh * 0.28, 220), 520);
      const h = Math.round((count - 1) * perCard + lastCardHeight + stickyTop);
      stack.style.minHeight = h + 'px';
    };
    setStackHeight();
    window.addEventListener('resize', setStackHeight);
    window.addEventListener('load', setStackHeight);

    cards.forEach((card, idx) => {
      const z = 100 + idx;
      card.style.zIndex = String(z);
      card.style.setProperty('--offset', String(idx));
    });

    const anim1 = $('.scroll-anim__item--1');
    const anim2 = $('.scroll-anim__item--2');
    const anim3 = $('.scroll-anim__item--3');
    const anim4 = $('.scroll-anim__item--4'); // new top-right
    const anim0 = $('.scroll-anim__item--0'); // new under CTA
    const processSection = $('#process');

    const setState = (el, state) => {
      if (!el) return;
      el.classList.remove('visible','dim');
      if (state === 'full') {
        el.classList.add('visible');
      } else if (state === 'dim') {
        el.classList.add('visible','dim');
      }
    };

    const getActiveStep = () => {
      let active = 0;
      for (let i = 0; i < cards.length; i++) {
        const rect = cards[i].getBoundingClientRect();
        if (rect.top <= (stickyTopVal + 4)) active = i + 1;
        else break;
      }
      return active;
    };


    const updateStepBlur = () => {
      const active = getActiveStep();
      cards.forEach((card, idx) => {
        if (idx < active - 1) {
          card.classList.add('blurred');
        } else {
          card.classList.remove('blurred');
        }
      });
    };

    const updateScrollAnim = () => {
  const r = processSection?.getBoundingClientRect();
  const onScreen = r && r.bottom > 0 && r.top < window.innerHeight;
  if (!onScreen) {
    setState(anim1, 'hide');
    setState(anim2, 'hide');
    setState(anim3, 'hide');
    setState(anim4, 'hide');
    setState(anim0, 'hide');
    return;
  }

  const step = getActiveStep();
  const heroHidden = document.querySelector('.logo--hero')?.classList.contains('is-hidden');

  // anim1 logic (unchanged)
  if (step <= 1) setState(anim1, 'hide');
  else if (step === 2) setState(anim1, 'dim');
  else if (step === 3 || step === 4) setState(anim1, 'full');
  else setState(anim1, 'hide');

  // anim2 logic (unchanged)
  if (step < 5) setState(anim2, 'hide');
  else if (step === 5) setState(anim2, 'dim');
  else if (step === 6) setState(anim2, 'full');
  else setState(anim2, 'hide');

  // anim3 logic (unchanged)
  if (step < 7) setState(anim3, 'hide');
  else if (step === 7) setState(anim3, 'dim');
  else if (step === 8) setState(anim3, 'full');
  else setState(anim3, 'hide');

  // anim4 + anim0 logic:
  // Appear only when hero hidden. Full at step 1, dim at step 2, hide at step >=3.
  if (!heroHidden || step === 0) {
    setState(anim4, 'hide');
    setState(anim0, 'hide');
  } else if (step === 1) {
    setState(anim4, 'full');
    setState(anim0, 'full');
  } else if (step === 2) {
    setState(anim4, 'dim');
    setState(anim0, 'dim');
  } else {
    setState(anim4, 'hide');
    setState(anim0, 'hide');
  }
};
    
      const onScrollUpdate = () => {
      updateScrollAnim();
      updateStepBlur();
    };

    onScrollUpdate();

    window.addEventListener('scroll', onScrollUpdate, { passive: true });
    window.addEventListener('resize', onScrollUpdate);
    window.addEventListener('load', onScrollUpdate);
  }

  const form = $('#lead-form');
  const toast = $('#form-toast');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const phone = (data.get('phone') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();
    const checkbox = $('#lead-form input[type="checkbox"]');

    if (!name || !phone) {
      showToast('Пожалуйста, заполните обязательные поля.');
      return;
    }

    if (!checkbox.checked) {
      showToast('Пожалуйста, согласитесь на обработку персональных данных.');
      return;
    }

    fetch(`https://telegramapi-887415677215.europe-west1.run.app`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, message })
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        showToast('Спасибо! Мы уже изучаем вашу задачу и свяжемся в ближайшее время.');
        form.reset();
      } else {
        showToast('Спасибо! Мы свяжемся с вами в ближайшее время.');
      }
    })
    .catch(() => {
      showToast('Ошибка отправки. Попробуйте позже.');
    });
  });

  function showToast(msg){
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  const heroLogo = $('.logo--hero');
  const hideLogoOnScroll = () => {
    if (!heroLogo) return;
    const threshold = (window.innerHeight || 800) * 0.15;
    if (window.scrollY > threshold) heroLogo.classList.add('is-hidden');
    else heroLogo.classList.remove('is-hidden');
  };
  window.addEventListener('scroll', hideLogoOnScroll, { passive: true });
  window.addEventListener('load', hideLogoOnScroll);

  const imagesIO = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in-view');
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
  );

  $$('img').forEach((img) => {
    if (!img.classList.contains('after') && !img.classList.contains('lightbox__img')) {
      img.classList.add('will-slide');
      imagesIO.observe(img);
    }
  });

  const CAROUSELS = {
    1: ['case1-1after.jpg','case1-2after.jpg','case1-3after.jpg','case1-4.jpg','case1-5.jpg','case1-6.jpg'],
    2: ['case2-0.jpg','case2-1after.jpg','case2-2after.jpg','case2-3after.jpg','case2-4.jpg','case2-5.jpg'],
    3: ['case3-1.jpg','case3-2.jpg','case3-3.jpg','case3-4.jpg'],
    4: ['case4-1after.jpg','case4-2.jpg','case4-3.jpg','case4-4.jpg','case4-5.jpg'],
    5: ['case5-1.jpg','case5-2.jpg','case5-3after.jpg','case5-4.jpg','case5-5.jpg'],
    6: ['case6-1.jpg','case6-2.jpg','case6-3after.jpg','case6-4.jpg','case6-5.jpg'],
  };

  const lightbox = $('#lightbox');
  const lbImg = $('.lightbox__img', lightbox);
  const btnClose = $('.lightbox__close', lightbox);
  const btnPrev = $('.lightbox__prev', lightbox);
  const btnNext = $('.lightbox__next', lightbox);

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

    let idx = files.findIndex(f => f === preferred);
    if (idx === -1) {
      idx = files.findIndex(f => f === clickName);
    }
    return Math.max(idx, 0);
  }

  function renderLightbox() {
    if (!lbImg) return;
    lbImg.src = currentList[currentIndex];
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

    if (lastActiveEl && typeof lastActiveEl.focus === 'function') {
      lastActiveEl.focus();
    }

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

  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });

  $$('figure.before-after').forEach((fig) => {
    if (!fig.hasAttribute('tabindex')) fig.setAttribute('tabindex', '0');
    if (!fig.hasAttribute('role')) fig.setAttribute('role', 'button');
    fig.setAttribute('aria-pressed', fig.classList.contains('toggled') ? 'true' : 'false');

    let reverseBtn = $('.reverse-btn', fig);
    if (!reverseBtn) {
      reverseBtn = document.createElement('button');
      reverseBtn.type = 'button';
      reverseBtn.className = 'reverse-btn';
      reverseBtn.setAttribute('aria-label', 'Показать «до»');
      reverseBtn.innerHTML = '<img src="undo.png" width="18" height="18" alt="" aria-hidden="true">';
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
      if (!fig.classList.contains('toggled')) {
        toggle();
        return;
      }
      attemptOpenAfter();
    });

    fig.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        if (!fig.classList.contains('toggled')) {
          toggle();
        } else {
          attemptOpenAfter();
        }
      }
    });
  });

  $$('article.case').forEach((article) => {
    const caseId = parseInt(article.getAttribute('data-case') || '0', 10);
    if (!caseId) return;
    article.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('.before-after')) return;
      const targetImg = target.closest('img');
      if (!targetImg) return;
      openLightbox(caseId, targetImg);
    });
  });

  if (isInAppWebView()) {
    document.documentElement.classList.add('inapp-webview');
    applyInAppOffsets();

    let raf;
    const onAdaptiveChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        applyInAppOffsets();
      });
    };
    window.addEventListener('resize', onAdaptiveChange);
    window.addEventListener('orientationchange', onAdaptiveChange);
    window.addEventListener('load', onAdaptiveChange);
    setTimeout(applyInAppOffsets, 350);
    setTimeout(applyInAppOffsets, 1000);
  }

  const isWmPath = (path) => /\/wm\/[^/]+$/.test(path);

  const toWmSrc = (src) => {
    try {
      const u = new URL(src, window.location.href);
      if (isWmPath(u.pathname)) return u.toString();
      u.pathname = u.pathname.replace(/\/([^\/]+)$/, '/wm/$1');
      return u.toString();
    } catch {
      if (/^wm\//.test(src)) return src;
      return 'wm/' + (src || '').replace(/^\.?\//, '');
    }
  };

  function revertFromWm(img){
    if (!img || !img.dataset) return;
    if (img.dataset.origSrc) {
      img.src = img.dataset.origSrc;
      delete img.dataset.origSrc;
    }
    if (img.dataset.origSrcset !== undefined) {
      img.srcset = img.dataset.origSrcset;
      delete img.dataset.origSrcset;
    }
    if (img._wmTimer) {
      clearTimeout(img._wmTimer);
      img._wmTimer = null;
    }
  }

  function swapToWm(img){
    if (!img) return;
    const current = img.currentSrc || img.src;
    const wm = toWmSrc(img.dataset.origSrc || current);
    if (current && (current === wm)) return;

    if (!img.dataset.origSrc) img.dataset.origSrc = current;
    if (img.srcset) {
      img.dataset.origSrcset = img.srcset;
      img.removeAttribute('srcset');
    }

    const onErr = () => { img.removeEventListener('error', onErr); revertFromWm(img); };
    img.addEventListener('error', onErr, { once: true });

    img.src = wm;

    if (img._wmTimer) clearTimeout(img._wmTimer);
    img._wmTimer = setTimeout(() => revertFromWm(img), 12000);
  }

  window.addEventListener('load', () => {
    $$('img').forEach((img) => {
      const src = img.currentSrc || img.src;
      const wmSrc = toWmSrc(src);
      if (wmSrc !== src) {
        const pre = new Image();
        pre.src = wmSrc;
      }
    });
  });

  document.addEventListener('contextmenu', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const img = t.closest('img');
    if (!img) return;
    swapToWm(img);
  });

  let longPressTimer = null;
  document.addEventListener('touchstart', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const img = t.closest('img');
    if (!img) return;
    longPressTimer = setTimeout(() => swapToWm(img), 350);
  }, { passive: true });

  const clearLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  };
  document.addEventListener('touchend', clearLongPress, { passive: true });
  document.addEventListener('touchcancel', clearLongPress, { passive: true });

  ['click','scroll','keydown','pointerdown','blur'].forEach((ev) => {
    window.addEventListener(ev, () => {
      $$('img').forEach((img) => {
        if (img.dataset && img.dataset.origSrc) {
          if (img._wmTimer) return;
          img._wmTimer = setTimeout(() => revertFromWm(img), 2000);
        }
      });
    }, { passive: true });
  });

  /* ------- Per-case fullscreen correlated backgrounds ------- */
  const caseArticles = $$('article.case');
  let activeCase = null;

  function updateActiveCase() {
    if (!caseArticles.length) return;
    const mid = (window.innerHeight || 0) / 2;
    let nextActive = null;
    for (const art of caseArticles) {
      const r = art.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) {
        nextActive = art;
        break;
      }
    }
    if (activeCase !== nextActive) {
      if (activeCase) activeCase.classList.remove('active');
      if (nextActive) nextActive.classList.add('active');
      activeCase = nextActive;
    }
  }

  function updateCaseBgShift() {
    // subtle left-right oscillation on scroll
    const shift = Math.sin(window.scrollY / 250) * 24; // ~ +/-24px
    document.documentElement.style.setProperty('--case-bg-shift', shift.toFixed(2) + 'px');
  }

  const onScrollBg = () => {
    updateActiveCase();
    updateCaseBgShift();
  };

  window.addEventListener('scroll', onScrollBg, { passive: true });
  window.addEventListener('resize', updateActiveCase, { passive: true });
  window.addEventListener('load', () => { updateActiveCase(); updateCaseBgShift(); });


  // ASCII Art with gradient colors
  const artLines = [
    "███████████   █████  █████  █████       ",
    "░░███░░░░░███ ░░███ ░░███  ░░███        ",
    " ░███    ░███  ░███  ░███   ░███        ",
    " ░██████████  ░███████████  ░███        ",
    " ░███░░░░░███  ░░░░░░░███ ░ ░███        ",
    " ░███    ░███        ░███  ░░███       █",
    " █████   █████        ████  ███████████ ",
    "░░░░░   ░░░░░        ░░░░░ ░░░░░░░░░░░  ",
    "                                        ",
    "                                        ",
    "                                        "
];

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  function logArt() {
    const startColor = hexToRgb('#fdb73e');
    const endColor = { r: 0, g: 0, b: 0 };
    artLines.forEach((line, i) => {
      const t = i / (artLines.length - 1);
      const r = lerp(startColor.r, endColor.r, t);
      const g = lerp(startColor.g, endColor.g, t);
      const b = lerp(startColor.b, endColor.b, t);
      console.log('%c' + line, `color: rgb(${r}, ${g}, ${b}); font-family: monospace;`);
    });
  }

  // Log on page load (simple and reliable across browsers)
  logArt();

  /* ----- Policy dialog open/close (added) ----- */
  const policyBtn = $('#open-policy');
  const policyDlg = $('#policy-dialog');
  const policyClose = $('.policy-dialog__close', policyDlg);

  function openPolicy(){
    if(!policyDlg) return;
    policyDlg.classList.add('open');
    policyDlg.setAttribute('aria-hidden','false');
    document.body.classList.add('no-scroll');
    policyClose?.focus();
  }
  function closePolicy(){
    if(!policyDlg) return;
    policyDlg.classList.remove('open');
    policyDlg.setAttribute('aria-hidden','true');
    document.body.classList.remove('no-scroll');
    policyBtn?.focus();
  }

  policyBtn?.addEventListener('click', openPolicy);
  policyClose?.addEventListener('click', closePolicy);
  policyDlg?.addEventListener('click', (e)=>{
    if(e.target === policyDlg) closePolicy();
  });
  document.addEventListener('keydown', (e)=>{
    if(!policyDlg?.classList.contains('open')) return;
    if(e.key === 'Escape'){
      e.preventDefault();
      closePolicy();
    }
  });

})();