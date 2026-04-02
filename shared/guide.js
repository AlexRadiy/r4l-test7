/* ===============================
   guide.js — Guide page logic
   - Form validation (including email regex)
   - Form submission (POST to Telegram API)
   - Show success state with download links
   =============================== */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);

  const form = $('#guide-form');
  const toast = $('#guide-toast');
  const successState = $('.guide-success');
  const formCard = $('.guide-form-card');

  if (!form) return;

  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  };

  // Email regex: basic format check
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = (form.elements['guide-name']?.value || '').trim();
    const email = (form.elements['guide-email']?.value || '').trim();
    const phone = (form.elements['guide-phone']?.value || '').trim();
    const checkbox = $('input[type="checkbox"]', form);

    // Validation
    if (!name) { showToast('Пожалуйста, укажите ваше имя.'); return; }
    if (!email) { showToast('Пожалуйста, укажите ваш email.'); return; }
    if (!emailPattern.test(email)) { showToast('Пожалуйста, введите корректный email.'); return; }
    if (!checkbox?.checked) {
      showToast('Пожалуйста, согласитесь на обработку персональных данных.');
      return;
    }

    const submitBtn = $('[type="submit"]', form);
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Отправляем…'; }

    // Build message for Telegram — include note that someone downloaded the guide
    const message = 'GUIDE LEAD: ' + email + (phone ? ', тел: ' + phone : '') + ' — кто-то скачал гайд!';

    fetch('https://telegramapi-887415677215.europe-west1.run.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone: email, message }),
    })
      .then((res) => res.json())
      .then(() => {
        // Show success state regardless of API response (avoid scaring user)
        showSuccessState();
      })
      .catch(() => {
        // Still show success — don't block the user if the API fails
        showSuccessState();
      });
  });

  function showSuccessState() {
    if (formCard && successState) {
      // Hide form, show success
      form.style.display = 'none';
      const title = $('.guide-form-card .form__title');
      if (title) title.style.display = 'none';
      // Hide the disclaimer text
      const disclaimer = formCard.querySelector('.subhead.reveal');
      if (disclaimer) disclaimer.style.display = 'none';
      successState.classList.add('visible');
    }
  }

})();
