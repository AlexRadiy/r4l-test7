/* calculator.js */
/* ===============================
   calculator.js — Calculator page logic (All-in-one format)
   - Single page form validation
   - Gemini AI call for rental estimate
   - Telegram notification
   - Results display
   =============================== */
(function () {
  'use strict';

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  // Quiz answers collected on submit
  const answers = {
    address: '',
    rooms: '',
    condition: '',
    floor: '',
    elevator: '',
    goal: '',
    email: '',
  };

  // DOM references
  const loadingEl = $('.calc-loading');
  const resultsEl = $('.calc-results');
  const quizEl = $('.calc-quiz');
  const submitBtn = $('#calc-submit-btn');

  // Email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---- Option button selection ---- */
  function initOptionButtons() {
    $$('.calc-option').forEach((btn) => {
      btn.addEventListener('click', () => {
        const fieldEl = btn.closest('.calc-field');
        if (!fieldEl) return;
        
        // Deselect siblings
        $$('.calc-option', fieldEl).forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        // Clear error if selection is made
        const errEl = $('.calc-error', fieldEl);
        if (errEl) errEl.classList.remove('show');
      });
    });
  }

  /* ---- Clear Input Errors on Typing ---- */
  $('#calc-address')?.addEventListener('input', (e) => {
    const errEl = $('#error-address');
    if (errEl) errEl.classList.remove('show');
  });

  $('#calc-email')?.addEventListener('input', (e) => {
    e.target.classList.remove('invalid');
    const errEl = $('#error-email');
    if (errEl) errEl.classList.remove('show');
  });

  $('#calc-consent')?.addEventListener('change', (e) => {
    const errEl = $('#error-consent');
    if (errEl) errEl.classList.remove('show');
  });

  /* ---- Validate entire form before advancing ---- */
  function validateForm() {
    let isValid = true;
    let firstErrorEl = null;

    // Reset all errors visually
    $$('.calc-error').forEach((err) => err.classList.remove('show'));
    $('#calc-email')?.classList.remove('invalid');

    function showError(id, msg) {
      const el = $('#' + id);
      if (el) {
        el.textContent = msg;
        el.classList.add('show');
        if (!firstErrorEl) firstErrorEl = el.closest('.calc-field');
      }
      isValid = false;
    }

    // 1. Address
    const addressInput = $('#calc-address');
    const addressVal = (addressInput?.value || '').trim();
    if (!addressVal) {
      showError('error-address', 'Пожалуйста, введите адрес.');
    } else {
      answers.address = addressVal;
    }

    // Options validation helper
    function validateOption(key, errorId, errorMsg) {
      const field = $(`.calc-field[data-answer-key="${key}"]`);
      if (!field) return;
      const selected = $('.calc-option.selected', field);
      if (!selected) {
        showError(errorId, errorMsg);
      } else {
        answers[key] = selected.dataset.value || selected.textContent.trim();
      }
    }

    // 2-6. Options
    validateOption('rooms', 'error-rooms', 'Пожалуйста, выберите количество комнат.');
    validateOption('condition', 'error-condition', 'Пожалуйста, выберите состояние квартиры.');
    validateOption('floor', 'error-floor', 'Пожалуйста, укажите этаж.');
    validateOption('elevator', 'error-elevator', 'Пожалуйста, укажите наличие лифта.');
    validateOption('goal', 'error-goal', 'Пожалуйста, выберите цель.');

    // 7. Email and Consent
    const emailInput = $('#calc-email');
    const emailVal = (emailInput?.value || '').trim();
    if (!emailVal) {
      if (emailInput) emailInput.classList.add('invalid');
      showError('error-email', 'Пожалуйста, введите email.');
    } else if (!emailPattern.test(emailVal)) {
      if (emailInput) emailInput.classList.add('invalid');
      showError('error-email', 'Пожалуйста, введите корректный email.');
    } else {
      answers.email = emailVal;
    }

    const consent = $('#calc-consent');
    if (!consent?.checked) {
      showError('error-consent', 'Пожалуйста, согласитесь на обработку персональных данных.');
    }

    // Scroll to the first error if validation failed
    if (!isValid && firstErrorEl) {
      firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isValid;
  }

  /* ---- Submit form ---- */
  function submitQuiz() {
    // Show loading, hide quiz
    if (quizEl) quizEl.style.display = 'none';
    if (loadingEl) loadingEl.classList.add('active');

    const today = new Date().toISOString().split('T')[0];

    const prompt = `Ты больше не чат, ты работаешь как профессиональное приложение для установки стоимости квартиры. Ты не задаешь вопросов, не уточняешь и не добавляешь никаких слов - ты можешь ответить только двумя цифрами, в рублях - сколько аренда этой квартиры стоит в месяц минимально и максимально. Затем сколько эта квартира может стоить в месяц при хорошем дизайне и ремонте, меблировке, хоумстейджинге, объявлении, работе с арендаторами. Если указано, что эта квартира для посуточной аренды - рассчитывай именно при посуточной аренде. К каждой цифре добавь небольшой анализ и советы и конкретно обоснуй свои советы на примерах, актуальных на сегодняшнее время для этого адреса и города. Проверь рынок недвижимости по адресу и вокруг. Укажи реальные цены. Проанализируй каждую деталь. Анализируй глубоко. Говори коротко и по делу - это важно!
Отвечать строго по форме - без эмодзи, без жирного шрифта, ты начинаешь цифрой, затем комментарий, затем цифра, затем комментарий. 
    Дата: ${today}
Адрес: ${answers.address}
комнат: ${answers.rooms}
ремонт: ${answers.condition}
этаж: ${answers.floor}
лифт: ${answers.elevator}
цель: ${answers.goal}
ФОРМА ОТВЕТА (с ценами для примера):
55 000 — 70 000

Комментарий

95 000 — 120 000 

Комментарий`;

    // Send Telegram notification (non-blocking)
    fetch('https://telegramapi-887415677215.europe-west1.run.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Калькулятор',
        phone: answers.email,
        message: `Кто-то воспользовался калькулятором!\nАдрес: ${answers.address}\nКомнат: ${answers.rooms}\nРемонт: ${answers.condition}\nЭтаж: ${answers.floor}\nЛифт: ${answers.elevator}\nЦель: ${answers.goal}`,
      }),
    }).catch(() => {
      // Ignore errors — notification is best-effort
    });

    // Call Gemini API with retry
    callGeminiWithRetry(prompt).then((reply) => {
      if (reply) {
        showResults(reply);
      } else {
        if (loadingEl) loadingEl.classList.remove('active');
        if (resultsEl) {
          resultsEl.classList.add('active');
          const titleEl = $('.calc-results__title');
          if (titleEl) titleEl.textContent = 'ошибка сервера 😔 Мы уже разбираемся!';
        }
      }
    });
  }

  /* ---- Gemini API call with retry ---- */
  async function callGeminiWithRetry(prompt, maxRetries = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch('https://gemini-cloud-function-994729946863.europe-west1.run.app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        const data = await res.json();
        const reply = (data.reply || '').trim();
        if (reply) return reply;
        lastError = 'Empty reply from Gemini (attempt ' + attempt + ')';
      } catch (err) {
        lastError = (err && err.message) || 'Network error (attempt ' + attempt + ')';
      }
      // Wait 3 seconds before next retry (but not after the last attempt)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
    // All retries failed — send error log to Telegram
    fetch('https://telegramapi-887415677215.europe-west1.run.app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'ОШИБКА Калькулятор',
        phone: answers.email || 'unknown',
        message: 'Gemini API не ответил после 3 попыток.\nПоследняя ошибка: ' + lastError + '\nАдрес: ' + answers.address,
      }),
    }).catch(() => {});
    return null;
  }

  /* ---- Parse and display Gemini results ---- */
  function showResults(reply) {
    if (loadingEl) loadingEl.classList.remove('active');
    if (!resultsEl) return;
    resultsEl.classList.add('active');

    // Populate answers summary
    const summaryEl = $('#calc-answers-summary');
    if (summaryEl) {
      const DAILY_RENTAL_KEYWORDS = ['посут', 'максимальная'];
      const liftText = answers.elevator === 'есть' ? 'есть лифт' : 'нет лифта';
      const goalLower = answers.goal ? answers.goal.toLowerCase() : '';
      const isDailyRental = DAILY_RENTAL_KEYWORDS.some((kw) => goalLower.includes(kw));
      const rentalType = isDailyRental ? 'при посуточной сдаче' : 'при помесячной сдаче';
      summaryEl.textContent = [
        answers.address,
        answers.rooms ? `${answers.rooms} комнат` : '',
        answers.condition,
        answers.floor ? `этаж: ${answers.floor}` : '',
        liftText,
        rentalType,
      ].filter(Boolean).join(' • ');
    }

    if (!reply) {
      return;
    }

    // Try to find two price-range lines like "55 000 — 70 000"
    const pricePattern = /^\s*[\d\s]+\s*[—–\-]\s*[\d\s]+/m;
    const lines = reply.split('\n');

    let firstBlockLines = [];
    let secondBlockLines = [];
    let foundFirst = false;
    let foundSecond = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!foundFirst && pricePattern.test(line)) {
        foundFirst = true;
        firstBlockLines.push(line);
      } else if (foundFirst && !foundSecond && pricePattern.test(line)) {
        foundSecond = true;
        secondBlockLines.push(line);
      } else if (foundSecond) {
        secondBlockLines.push(line);
      } else if (foundFirst) {
        firstBlockLines.push(line);
      }
    }

    // Fallback to old split logic if pattern matching fails
    if (!foundFirst || !foundSecond) {
      const blocks = reply.split(/\n\s*\n/).filter((b) => b.trim());
      firstBlockLines = (blocks[0] || '').split('\n');
      secondBlockLines = (blocks[1] || '').split('\n');
    }

    function parseBlock(blockLines) {
      const filtered = blockLines.filter((l) => l.trim());
      if (filtered.length > 1 && filtered[filtered.length - 1].trim().endsWith('?')) {
        filtered.pop();
      }
      const number = filtered[0] || '—';
      const analysis = filtered.slice(1).join('\n');
      return { number, analysis };
    }

    const first = parseBlock(firstBlockLines);
    const second = parseBlock(secondBlockLines);

    const currentNumEl = $('#result-current-num');
    const currentAnalysisEl = $('#result-current-analysis');
    const potentialNumEl = $('#result-potential-num');
    const potentialAnalysisEl = $('#result-potential-analysis');

    if (currentNumEl) currentNumEl.textContent = first.number;
    if (currentAnalysisEl) currentAnalysisEl.textContent = first.analysis;
    if (potentialNumEl) potentialNumEl.textContent = second.number;
    if (potentialAnalysisEl) potentialAnalysisEl.textContent = second.analysis;
  }

  /* ---- Init ---- */
  initOptionButtons();

  submitBtn?.addEventListener('click', () => {
    if (validateForm()) {
      submitQuiz();
    }
  });

})();