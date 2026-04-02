/* ===============================
   process.js — Process page logic
   - Sticky card stack height calculation
   - Blur passed cards
   - Scroll overlay animations (anim0–4)
   =============================== */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const stack = $('#process-stack');
  if (!stack) return;

  const cards = $$('.step-card', stack);
  const countAttr = parseInt(stack.getAttribute('data-card-count') || cards.length, 10);
  const count = Math.max(countAttr, cards.length);

  /* ---- Set z-index and offset for stacking effect ---- */
  cards.forEach((card, idx) => {
    card.style.zIndex = String(100 + idx);
    card.style.setProperty('--offset', String(idx));
  });

  /* ---- Dynamic stack height so all cards fit in document flow ---- */
  let stickyTopVal = 96;

  const setStackHeight = () => {
    const vh = Math.max(window.innerHeight || 0, 600);
    const lastCard = cards[cards.length - 1];
    const lastCardHeight = lastCard?.offsetHeight || vh;
    const computedTop = parseFloat(getComputedStyle(cards[0])?.top) || Math.max(vh * 0.12, 96);
    stickyTopVal = computedTop;
    const perCard = Math.min(Math.max(vh * 0.28, 220), 520);
    const h = Math.round((count - 1) * perCard + lastCardHeight + computedTop);
    stack.style.minHeight = h + 'px';
  };

  setStackHeight();
  window.addEventListener('resize', setStackHeight);
  window.addEventListener('load', setStackHeight);

  /* ---- Determine which step card is active (visible at top) ---- */
  const getActiveStep = () => {
    let active = 0;
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (rect.top <= (stickyTopVal + 4)) active = i + 1;
      else break;
    }
    return active;
  };

  /* ---- Blur cards that have been scrolled past ---- */
  const updateStepBlur = () => {
    const active = getActiveStep();
    cards.forEach((card, idx) => {
      card.classList.toggle('blurred', idx < active - 1);
    });
  };

  /* ---- Scroll overlay animation state ---- */
  const anim1 = $('.scroll-anim__item--1');
  const anim2 = $('.scroll-anim__item--2');
  const anim3 = $('.scroll-anim__item--3');
  const anim4 = $('.scroll-anim__item--4');
  const anim0 = $('.scroll-anim__item--0');

  const setState = (el, state) => {
    if (!el) return;
    el.classList.remove('visible', 'dim');
    if (state === 'full') el.classList.add('visible');
    else if (state === 'dim') el.classList.add('visible', 'dim');
  };

  const updateScrollAnim = () => {
    const step = getActiveStep();

    // anim1: left side (steps 2-4)
    if (step <= 1)          setState(anim1, 'hide');
    else if (step === 2)    setState(anim1, 'dim');
    else if (step <= 4)     setState(anim1, 'full');
    else                    setState(anim1, 'hide');

    // anim2: right side (steps 5-6)
    if (step < 5)           setState(anim2, 'hide');
    else if (step === 5)    setState(anim2, 'dim');
    else if (step === 6)    setState(anim2, 'full');
    else                    setState(anim2, 'hide');

    // anim3: left bottom (steps 7-8)
    if (step < 7)           setState(anim3, 'hide');
    else if (step === 7)    setState(anim3, 'dim');
    else if (step === 8)    setState(anim3, 'full');
    else                    setState(anim3, 'hide');

    // anim4 + anim0: top-right (steps 1-2)
    if (step === 0)         { setState(anim4, 'hide'); setState(anim0, 'hide'); }
    else if (step === 1)    { setState(anim4, 'full'); setState(anim0, 'full'); }
    else if (step === 2)    { setState(anim4, 'dim');  setState(anim0, 'dim'); }
    else                    { setState(anim4, 'hide'); setState(anim0, 'hide'); }
  };

  const onScrollUpdate = () => {
    updateScrollAnim();
    updateStepBlur();
  };

  onScrollUpdate();
  window.addEventListener('scroll', onScrollUpdate, { passive: true });
  window.addEventListener('resize', onScrollUpdate);
  window.addEventListener('load', onScrollUpdate);

})();
