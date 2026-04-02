/* ===============================
   shared.js — Room4Life
   Shared logic for ALL pages:
   - Navigation (active link, scroll state)
   - Three.js liquid sphere in nav (with mouse reactivity)
   - Floating CTA button (opens contact overlay)
   - Contact overlay (form + social links)
   - Reveal animations (IntersectionObserver)
   - Watermark protection
   - Policy dialog
   - Console ASCII art
   - In-app webview detection
   =============================== */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /* ---- In-app webview detection ---- */
  const isInAppWebView = () => {
    const ua = navigator.userAgent || navigator.vendor || '';
    return /Instagram|FBAN|FBAV|Line|WeChat|MiuiBrowser|Telegram/i.test(ua);
  };

  if (isInAppWebView()) {
    document.documentElement.classList.add('inapp-webview');
  }

  /* ---- Navigation: active link ---- */
  const currentPath = window.location.pathname.replace(/\/$/, '');
  $$('.nav__link').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const linkPath = href.replace(/\/$/, '');
    if (linkPath && (currentPath === linkPath || currentPath.startsWith(linkPath + '/'))) {
      link.classList.add('active');
    }
  });

  /* ---- Navigation: scroll state (frosted glass) ---- */
  const nav = $('#site-nav');
  // If the page has a dark hero (video/image), start nav transparent.
  // Otherwise start in scrolled mode so text is always readable.
  const hasHero = !!$('.hero');

  const updateNavScroll = () => {
    if (!nav) return;
    if (!hasHero || window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', updateNavScroll, { passive: true });
  updateNavScroll();

  /* ---- Three.js liquid sphere in nav ---- */
  function initSphere(canvas) {
    if (!canvas || typeof THREE === 'undefined') return;
    // Skip sphere on mobile to save resources
    if (window.matchMedia('(max-width: 680px)').matches) return;

    const size = 44;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(size, size, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2.8;

    // Low-poly sphere for organic liquid feel
    const geometry = new THREE.IcosahedronGeometry(1, 3);
    const material = new THREE.MeshStandardMaterial({
      color: 0xfdb73e,
      emissive: 0xfeedcf,
      emissiveIntensity: 0.2,
      roughness: 0.35,
      metalness: 0.08,
      transparent: true,
      opacity: 0.68,
    });

    // Lights for warmth
    const dirLight = new THREE.DirectionalLight(0xfedcb0, 1.4);
    dirLight.position.set(2, 3, 2);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xb1aba3, 0.5);
    scene.add(ambLight);

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Store original vertex positions for displacement
    const posAttr = geometry.attributes.position;
    const origPositions = new Float32Array(posAttr.array);

    // Mouse hover state
    let isHovered = false;
    let mouseInfluence = 0; // 0 = idle, 1 = hovered

    canvas.addEventListener('mouseenter', () => { isHovered = true; });
    canvas.addEventListener('mouseleave', () => { isHovered = false; });

    let t = 0;
    function animate() {
      requestAnimationFrame(animate);

      // Smoothly transition influence toward target (hover or idle)
      const targetInfluence = isHovered ? 1 : 0;
      mouseInfluence += (targetInfluence - mouseInfluence) * 0.05;

      // Idle: slow gentle animation. Hover: faster, bigger displacement
      const speed = 0.015 + mouseInfluence * 0.03;
      const displace = 0.14 + mouseInfluence * 0.18;
      const rotSpeed = 0.006 + mouseInfluence * 0.016;

      t += speed;

      // Organic vertex displacement using sine waves
      for (let i = 0; i < posAttr.count; i++) {
        const ox = origPositions[i * 3];
        const oy = origPositions[i * 3 + 1];
        const oz = origPositions[i * 3 + 2];
        const noise = Math.sin(ox * 2.5 + t) * Math.sin(oy * 2.5 + t * 0.8) * Math.cos(oz + t * 0.6) * displace;
        posAttr.setXYZ(i, ox + ox * noise, oy + oy * noise, oz + oz * noise);
      }
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();

      sphere.rotation.y += rotSpeed;
      sphere.rotation.x += rotSpeed * 0.33;

      renderer.render(scene, camera);
    }

    animate();
  }

  // Init sphere once DOM and Three.js are ready
  window.addEventListener('load', () => {
    initSphere($('#nav-sphere'));
  });
  // Fallback if load already fired
  if (document.readyState === 'complete') {
    initSphere($('#nav-sphere'));
  }

  /* ---- Reveal animations (IntersectionObserver) ---- */
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

  /* ---- Image slide-in animations ---- */
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
  $$('img:not(.after):not(.lightbox__img)').forEach((img) => {
    img.classList.add('will-slide');
    imagesIO.observe(img);
  });

  /* ---- Watermark protection ---- */
  const isWmPath = (path) => /\/wm\/[^/]+$/.test(path);

  const toWmSrc = (src) => {
    try {
      const u = new URL(src, window.location.href);
      if (isWmPath(u.pathname)) return u.toString();
      u.pathname = u.pathname.replace(/\/([^/]+)$/, '/wm/$1');
      return u.toString();
    } catch {
      if (/^wm\//.test(src)) return src;
      return '/wm/' + (src || '').replace(/^[./]+/, '');
    }
  };

  function revertFromWm(img) {
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

  function swapToWm(img) {
    if (!img) return;
    const current = img.currentSrc || img.src;
    const wm = toWmSrc(img.dataset.origSrc || current);
    if (current && current === wm) return;

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

  // Pre-cache watermarked versions on load
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

  // Right-click → swap to watermark
  document.addEventListener('contextmenu', (e) => {
    const img = e.target instanceof Element ? e.target.closest('img') : null;
    if (!img) return;
    swapToWm(img);
  });

  // Long-press → swap to watermark (mobile)
  let longPressTimer = null;
  document.addEventListener('touchstart', (e) => {
    const img = e.target instanceof Element ? e.target.closest('img') : null;
    if (!img) return;
    longPressTimer = setTimeout(() => swapToWm(img), 350);
  }, { passive: true });

  const clearLongPress = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
  };
  document.addEventListener('touchend', clearLongPress, { passive: true });
  document.addEventListener('touchcancel', clearLongPress, { passive: true });

  // Revert watermark on user interaction
  ['click', 'scroll', 'keydown', 'pointerdown', 'blur'].forEach((ev) => {
    window.addEventListener(ev, () => {
      $$('img').forEach((img) => {
        if (img.dataset && img.dataset.origSrc && !img._wmTimer) {
          img._wmTimer = setTimeout(() => revertFromWm(img), 2000);
        }
      });
    }, { passive: true });
  });

  /* ---- Contact Overlay ---- */
  const contactOverlay = $('#contact-overlay');
  const overlayClose = contactOverlay ? $('.contact-overlay__close', contactOverlay) : null;
  const overlayForm = contactOverlay ? $('#overlay-lead-form', contactOverlay) : null;
  const overlayToast = contactOverlay ? $('#overlay-form-toast', contactOverlay) : null;

  function openContactOverlay() {
    if (!contactOverlay) return;
    contactOverlay.classList.add('open');
    contactOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    overlayClose?.focus();
  }

  function closeContactOverlay() {
    if (!contactOverlay) return;
    contactOverlay.classList.remove('open');
    contactOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  // Floating CTA button opens overlay
  const ctaFloating = $('.cta-floating');
  ctaFloating?.addEventListener('click', openContactOverlay);

  // Any element with .open-contact-overlay opens it
  $$('.open-contact-overlay').forEach((el) => {
    el.addEventListener('click', openContactOverlay);
  });

  overlayClose?.addEventListener('click', closeContactOverlay);
  contactOverlay?.addEventListener('click', (e) => {
    if (e.target === contactOverlay) closeContactOverlay();
  });
  document.addEventListener('keydown', (e) => {
    if (contactOverlay?.classList.contains('open') && e.key === 'Escape') {
      e.preventDefault();
      closeContactOverlay();
    }
  });

  // Overlay form submission
  if (overlayForm) {
    const showOverlayToast = (msg) => {
      if (!overlayToast) return;
      overlayToast.textContent = msg;
      overlayToast.classList.add('show');
      setTimeout(() => overlayToast.classList.remove('show'), 4000);
    };

    overlayForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (overlayForm.elements['name']?.value || '').trim();
      const phone = (overlayForm.elements['phone']?.value || '').trim();
      const message = (overlayForm.elements['message']?.value || '').trim();
      const checkbox = overlayForm.querySelector('input[type="checkbox"]');

      if (!name) { showOverlayToast('Пожалуйста, укажите ваше имя.'); return; }
      if (!phone) { showOverlayToast('Пожалуйста, укажите контактные данные.'); return; }
      if (!checkbox?.checked) {
        showOverlayToast('Пожалуйста, согласитесь на обработку персональных данных.');
        return;
      }

      const submitBtn = overlayForm.querySelector('[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Отправляем…'; }

      fetch('https://telegramapi-887415677215.europe-west1.run.app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, message }),
      })
        .then((res) => res.json())
        .then(() => { showOverlayToast('Отправлено! Мы свяжемся с вами в ближайшее время.'); })
        .catch(() => { showOverlayToast('Отправлено! Мы свяжемся с вами в ближайшее время.'); })
        .finally(() => {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Отправить'; }
          overlayForm.reset();
        });
    });
  }

  /* ---- Burger menu (mobile, pages with has-burger-nav class) ---- */
  if (document.body.classList.contains('has-burger-nav')) {
    const burgerBtn = $('#nav-burger');
    const mobileMenu = $('#nav-mobile-menu');

    if (burgerBtn && mobileMenu) {
      // Mark active link in mobile menu
      $$('.nav__mobile-link', mobileMenu).forEach((link) => {
        const href = link.getAttribute('href') || '';
        const linkPath = href.replace(/\/$/, '');
        if (linkPath && (currentPath === linkPath || currentPath.startsWith(linkPath + '/'))) {
          link.classList.add('active');
        }
      });

      function openMobileMenu() {
        mobileMenu.classList.add('open');
        burgerBtn.classList.add('open');
        burgerBtn.setAttribute('aria-expanded', 'true');
        mobileMenu.setAttribute('aria-hidden', 'false');
      }

      function closeMobileMenu() {
        mobileMenu.classList.remove('open');
        burgerBtn.classList.remove('open');
        burgerBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }

      burgerBtn.addEventListener('click', () => {
        if (mobileMenu.classList.contains('open')) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });

      // Close menu when a link is tapped
      $$('.nav__mobile-link', mobileMenu).forEach((link) => {
        link.addEventListener('click', closeMobileMenu);
      });

      // "Контакты" button in mobile menu opens contact overlay
      const mobileCta = $('#nav-mobile-cta');
      mobileCta?.addEventListener('click', () => {
        closeMobileMenu();
        openContactOverlay();
      });

      // Close menu on outside click
      document.addEventListener('click', (e) => {
        const nav = $('#site-nav');
        if (
          mobileMenu.classList.contains('open') &&
          !mobileMenu.contains(e.target) &&
          !nav?.contains(e.target)
        ) {
          closeMobileMenu();
        }
      });
    }
  }

  /* ---- Policy dialog ---- */
  const policyBtn = $('#open-policy');
  const policyDlg = $('#policy-dialog');
  const policyClose = policyDlg ? $('.policy-dialog__close', policyDlg) : null;

  function openPolicy() {
    if (!policyDlg) return;
    policyDlg.classList.add('open');
    policyDlg.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    policyClose?.focus();
  }
  function closePolicy() {
    if (!policyDlg) return;
    policyDlg.classList.remove('open');
    policyDlg.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    policyBtn?.focus();
  }

  policyBtn?.addEventListener('click', openPolicy);
  policyClose?.addEventListener('click', closePolicy);
  policyDlg?.addEventListener('click', (e) => {
    if (e.target === policyDlg) closePolicy();
  });
  document.addEventListener('keydown', (e) => {
    if (!policyDlg?.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); closePolicy(); }
  });

  /* ---- Console ASCII art (brand gradient) ---- */
  const artLines = [
    "███████████   █████  █████  █████       ",
    "░░███░░░░░███ ░░███ ░░███  ░░███        ",
    " ░███    ░███  ░███  ░███   ░███        ",
    " ░██████████  ░███████████  ░███        ",
    " ░███░░░░░███  ░░░░░░░███ ░ ░███        ",
    " ░███    ░███        ░███  ░░███       █",
    " █████   █████        ████  ███████████ ",
    "░░░░░   ░░░░░        ░░░░░ ░░░░░░░░░░░  ",
    "                                        ",
    "                                        ",
    "                                        ",
  ];

  function hexToRgb(hex) {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
  }
  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

  (function logArt() {
    const start = hexToRgb('#fdb73e');
    const end = { r: 0, g: 0, b: 0 };
    artLines.forEach((line, i) => {
      const t = i / (artLines.length - 1);
      const r = lerp(start.r, end.r, t);
      const g = lerp(start.g, end.g, t);
      const b = lerp(start.b, end.b, t);
      console.log('%c' + line, `color: rgb(${r},${g},${b}); font-family: monospace;`);
    });
  })();

})();
