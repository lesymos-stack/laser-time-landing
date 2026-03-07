/* === Form Logic: Phone mask, validation, submit === */

// URL Google Apps Script (вставьте после настройки)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzot_DEmbn5zK8CQgEPPfYnckJ-kDs4eRhwm6JnAMGUWjK2NkMzOs98Qo-YKpVqKlydHg/exec';

document.addEventListener('DOMContentLoaded', () => {
  const phoneInput = document.getElementById('phoneInput');
  const submitBtn = document.getElementById('submitBtn');
  const phoneError = document.getElementById('phoneError');
  const networkError = document.getElementById('networkError');

  if (!phoneInput || !submitBtn) return;

  // === Phone Mask ===
  // Format: +7 (999) 999-99-99

  phoneInput.addEventListener('focus', () => {
    if (phoneInput.value === '') {
      phoneInput.value = '+7 (';
    }
    trackEvent('phone_focus');
  });

  phoneInput.addEventListener('input', (e) => {
    let value = phoneInput.value.replace(/\D/g, '');

    // Ensure starts with 7
    if (value.length === 0) {
      phoneInput.value = '+7 (';
      return;
    }
    if (value[0] === '8') value = '7' + value.slice(1);
    if (value[0] !== '7') value = '7' + value;

    // Limit to 11 digits
    value = value.slice(0, 11);

    // Format
    let formatted = '+7';
    if (value.length > 1) {
      formatted += ' (' + value.slice(1, 4);
    }
    if (value.length >= 4) {
      formatted += ') ' + value.slice(4, 7);
    }
    if (value.length >= 7) {
      formatted += '-' + value.slice(7, 9);
    }
    if (value.length >= 9) {
      formatted += '-' + value.slice(9, 11);
    }

    phoneInput.value = formatted;

    // Validate
    validatePhone();
  });

  phoneInput.addEventListener('keydown', (e) => {
    // Allow backspace to work naturally
    if (e.key === 'Backspace' && phoneInput.value.length <= 4) {
      e.preventDefault();
      phoneInput.value = '+7 (';
    }
  });

  // Prevent paste of non-digits
  phoneInput.addEventListener('paste', (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData).getData('text');
    const digits = pasted.replace(/\D/g, '');
    // Simulate input
    phoneInput.value = digits;
    phoneInput.dispatchEvent(new Event('input'));
  });

  function getDigits() {
    return phoneInput.value.replace(/\D/g, '');
  }

  function validatePhone() {
    const digits = getDigits();
    const isValid = digits.length === 11 && digits[0] === '7';

    if (isValid) {
      phoneInput.classList.remove('error');
      phoneError.classList.remove('visible');
      submitBtn.disabled = false;
    } else {
      submitBtn.disabled = true;
      // Only show error if user has typed something meaningful
      if (digits.length > 4) {
        phoneInput.classList.add('error');
        phoneError.classList.add('visible');
      } else {
        phoneInput.classList.remove('error');
        phoneError.classList.remove('visible');
      }
    }

    return isValid;
  }

  // Track phone abandonment
  let phoneStartedTyping = false;
  phoneInput.addEventListener('input', () => {
    if (!phoneStartedTyping && getDigits().length > 4) {
      phoneStartedTyping = true;
    }
  });

  window.addEventListener('beforeunload', () => {
    if (phoneStartedTyping && getDigits().length < 11) {
      trackEvent('phone_abandon', { digits_entered: getDigits().length });
    }
  });

  // === Submit ===
  submitBtn.addEventListener('click', async () => {
    if (!validatePhone()) return;

    const phone = phoneInput.value;
    const answers = window.quizManager ? window.quizManager.getAnswers() : {};

    // Loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.textContent = 'Отправляем...';
    submitBtn.disabled = true;
    networkError.classList.remove('visible');

    const payload = {
      type: 'quiz',
      phone: phone,
      answers: answers,
      timestamp: new Date().toISOString(),
      source: 'quiz_landing'
    };

    try {
      // Отправка в Google Sheets + Telegram
      if (GOOGLE_SCRIPT_URL) {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      trackEvent('lead_form_submitted', {
        phone_masked: phone.slice(0, 7) + '***',
        answers: answers
      });

      // Redirect to thank you
      window.location.href = 'thank-you.html';

    } catch (err) {
      console.error('Submit error:', err);

      // Даже при ошибке сети — редиректим, чтобы не потерять клиента
      window.location.href = 'thank-you.html';
    }
  });
});
