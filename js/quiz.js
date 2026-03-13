/* === Quiz Logic === */

const QUIZ_DATA = {
  questions: [
    {
      id: 1,
      text: 'Делали лазерную эпиляцию раньше?',
      hint_text: 'Это поможет подобрать оптимальные параметры',
      multiple: false,
      options: [
        { id: 'never',    icon: '', label: 'Нет \u2014 хочу попробовать впервые' },
        { id: 'continue', icon: '', label: 'Да \u2014 хочу продолжить курс' },
        { id: 'bad',      icon: '', label: 'Пробовала, но был неудачный опыт' }
      ],
      hints: {
        'never': 'Понимаем ваши сомнения! У нас аппарат с мощной системой охлаждения \u2014 ощущения лёгкого покалывания. Более 90% клиенток удивляются, что это совсем не больно.',
        'bad':   'Нам жаль, что был неудачный опыт! Наш аппарат 2024 года с охлаждением \u2014 это совсем другой уровень комфорта. Первый сеанс можно попробовать на маленькой зоне.'
      }
    },
    {
      id: 2,
      text: 'Какую зону планируете делать?',
      multiple: true,
      options: [
        { id: 'bikini',  icon: '', label: 'Бикини (глубокое)' },
        { id: 'armpits', icon: '', label: 'Подмышки' },
        { id: 'legs',    icon: '', label: 'Ноги (полностью)' },
        { id: 'complex', icon: '', label: 'Комплекс зон' },
        { id: 'other',   icon: '', label: 'Другая зона' }
      ]
    },
    {
      id: 3,
      text: 'Ваш цвет волос в зоне эпиляции?',
      hint_text: 'Это влияет на мощность лазера и количество сеансов',
      multiple: false,
      options: [
        { id: 'dark',  icon: '', label: 'Т\u0451мный / ч\u0451рный' },
        { id: 'brown', icon: '', label: 'Каштановый / коричневый' }
      ]
    },
    {
      id: 4,
      text: 'Когда планируете начать?',
      multiple: false,
      options: [
        { id: 'this_week',  icon: '', label: 'На этой неделе \u2014 хочу быстро' },
        { id: 'this_month', icon: '', label: 'В этом месяце' },
        { id: 'just_look',  icon: '', label: 'Пока просто узнаю цену' }
      ]
    }
  ],

  // Intermediate selling screens shown AFTER certain questions
  interstitials: {
    // After question 2 (zone selection)
    2: {
      icon: '',
      title: 'Отличный выбор!',
      text: 'Уже 847 клиенток из Анапы доверяют нам уход за этими зонами',
      highlight: '98% приходят повторно'
    },
    // After question 3 (hair color) — personalized result
    3: {
      icon: '',
      title: 'Хорошие новости!',
      textByAnswer: {
        'dark':  'Для т\u0451мных волос лазер работает эффективнее всего \u2014 обычно достаточно 6\u20138 сеансов.',
        'brown': 'Каштановые волосы отлично поддаются лазеру \u2014 обычно нужно 6\u201310 сеансов.'
      },
      highlight: 'Это один из лучших показателей'
    }
  }
};

class QuizManager {
  constructor() {
    this.currentStep = 0;
    this.answers = {};
    this.stepStartTime = null;
    this.questionEl = document.getElementById('quizQuestion');
    this.progressFill = document.getElementById('progressFill');
    this.progressText = document.getElementById('progressText');
    this.nextBtn = document.getElementById('quizNext');
    this.leadForm = document.getElementById('leadForm');
    this.showingInterstitial = false;
  }

  init() {
    this.renderQuestion(0);
    this.nextBtn.addEventListener('click', () => this.handleNext());
    this.updateProgress();
    this.stepStartTime = Date.now();
  }

  renderQuestion(index) {
    const q = QUIZ_DATA.questions[index];
    if (!q) return;

    this.nextBtn.disabled = true;
    this.nextBtn.style.display = '';
    this.showingInterstitial = false;

    let html = `<h2 class="quiz-question__title">${q.text}</h2>`;

    if (q.hint_text) {
      html += `<p class="quiz-question__hint-text">${q.hint_text}</p>`;
    }

    if (q.multiple) {
      html += `<p class="quiz-question__multi-hint">
        <svg data-lucide="info" width="16" height="16"></svg>
        Можно выбрать несколько
      </p>`;
    }

    html += '<div class="quiz-options">';
    q.options.forEach(opt => {
      html += `
        <div class="quiz-option" data-option-id="${opt.id}" role="button" tabindex="0">
          <span class="quiz-option__icon">${opt.icon}</span>
          <span class="quiz-option__label">${opt.label}</span>
          <span class="quiz-option__check"></span>
        </div>`;
    });
    html += '</div>';
    html += '<div class="quiz-hint-container" id="hintContainer"></div>';

    // Animate
    this.questionEl.classList.remove('slide-in');
    this.questionEl.classList.add('slide-out');

    setTimeout(() => {
      this.questionEl.innerHTML = html;
      this.questionEl.classList.remove('slide-out');
      this.questionEl.classList.add('slide-in');
      this.bindOptions(q);

      // Re-create Lucide icons in new content
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }, this.currentStep === 0 && index === 0 ? 0 : 300);
  }

  bindOptions(question) {
    const options = this.questionEl.querySelectorAll('.quiz-option');
    options.forEach(el => {
      const handler = () => this.selectOption(question, el.dataset.optionId, el);
      el.addEventListener('click', handler);
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handler();
        }
      });
    });
  }

  selectOption(question, optionId, el) {
    const qId = question.id;

    if (question.multiple) {
      // Toggle selection
      el.classList.toggle('selected');
      if (!this.answers[qId]) this.answers[qId] = [];
      const idx = this.answers[qId].indexOf(optionId);
      if (idx > -1) {
        this.answers[qId].splice(idx, 1);
      } else {
        this.answers[qId].push(optionId);
      }
      this.nextBtn.disabled = this.answers[qId].length === 0;
    } else {
      // Single selection
      this.questionEl.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      this.answers[qId] = optionId;
      this.nextBtn.disabled = false;
    }

    // Show hint if applicable
    if (question.hints && question.hints[optionId]) {
      this.showHint(question.hints[optionId]);
    }
  }

  showHint(text) {
    const container = document.getElementById('hintContainer');
    if (!container) return;
    container.innerHTML = `
      <div class="quiz-hint">
        <span>${text}</span>
      </div>`;
  }

  handleNext() {
    // Track step duration
    if (this.stepStartTime) {
      trackStepDuration(this.currentStep + 1, Date.now() - this.stepStartTime);
    }

    const qId = QUIZ_DATA.questions[this.currentStep].id;
    trackEvent('quiz_step_' + qId, { answer: this.answers[qId] });

    // Check if there's an interstitial to show after this question
    // Skip "Отличный выбор!" if only "other" zone is selected
    const interstitial = QUIZ_DATA.interstitials[qId];
    const skipInterstitial = qId === 2 && Array.isArray(this.answers[2]) &&
      this.answers[2].length === 1 && this.answers[2][0] === 'other';
    if (interstitial && !this.showingInterstitial && !skipInterstitial) {
      this.showInterstitial(interstitial, qId);
      return;
    }

    this.currentStep++;
    this.stepStartTime = Date.now();

    if (this.currentStep >= QUIZ_DATA.questions.length) {
      this.showLeadForm();
    } else {
      this.updateProgress();
      this.renderQuestion(this.currentStep);
    }
  }

  showInterstitial(data, qId) {
    this.showingInterstitial = true;

    let text = data.text;
    // Personalized text based on answer
    if (data.textByAnswer && this.answers[qId]) {
      text = data.textByAnswer[this.answers[qId]] || data.text || '';
    }

    const html = `
      <div class="quiz-interstitial">
        <div class="quiz-interstitial__icon">${data.icon}</div>
        <div class="quiz-interstitial__title">${data.title}</div>
        <div class="quiz-interstitial__text">${text}</div>
        ${data.highlight ? `<div class="quiz-interstitial__highlight">${data.highlight}</div>` : ''}
      </div>`;

    this.questionEl.classList.remove('slide-in');
    this.questionEl.classList.add('slide-out');

    setTimeout(() => {
      this.questionEl.innerHTML = html;
      this.questionEl.classList.remove('slide-out');
      this.questionEl.classList.add('slide-in');

      // Button text changes to "Далее"
      this.nextBtn.disabled = false;
      this.nextBtn.innerHTML = 'Далее <svg data-lucide="arrow-right" width="20" height="20"></svg>';
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 300);
  }

  updateProgress() {
    const total = QUIZ_DATA.questions.length;
    const current = this.currentStep + 1;
    const pct = (this.currentStep / total) * 100;

    this.progressFill.style.width = pct + '%';
    this.progressText.textContent = `Вопрос ${current} из ${total}`;
  }

  showLeadForm() {
    trackEvent('lead_form_shown');

    // Fill price preview based on selected zones
    this.fillPricePreview();

    // Animate out question, show form
    this.questionEl.classList.add('slide-out');
    this.nextBtn.style.display = 'none';
    this.progressFill.style.width = '100%';
    this.progressText.textContent = 'Почти готово!';

    setTimeout(() => {
      this.questionEl.style.display = 'none';
      this.leadForm.style.display = 'block';
      // Re-create Lucide icons
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 300);
  }

  fillPricePreview() {
    const prices = {
      'bikini':  { zone: 'Бикини (глубокое)', price: 'от 990 до 1 390 \u20BD' },
      'armpits': { zone: 'Подмышки',          price: 'от 500 до 700 \u20BD' },
      'legs':    { zone: 'Ноги (полностью)',   price: 'от 2 145 до 3 000 \u20BD' },
      'complex': { zone: 'Комплекс зон',       price: 'индивидуально' },
      'other':   { zone: 'Другая зона',         price: 'индивидуально' }
    };

    const selectedZones = this.answers[2]; // question id 2 = zones
    const container = document.getElementById('pricePreviewRows');
    if (!container) return;

    let rows = '';
    if (Array.isArray(selectedZones)) {
      selectedZones.forEach(zoneId => {
        const p = prices[zoneId];
        if (p) {
          rows += `
            <div class="price-preview__row">
              <span class="price-preview__zone">${p.zone}</span>
              <span class="price-preview__price">${p.price}</span>
            </div>`;
        }
      });
    }

    if (!rows) {
      rows = `
        <div class="price-preview__row">
          <span class="price-preview__zone">Ваши зоны</span>
          <span class="price-preview__price">расч\u0451т готов</span>
        </div>`;
    }

    container.innerHTML = rows;
  }

  getAnswers() {
    return { ...this.answers };
  }
}

// Initialize quiz when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.quizManager = new QuizManager();
  window.quizManager.init();
});
