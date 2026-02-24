/* === Form Logic: Phone mask, validation, submit === */

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
      phone: phone,
      answers: answers,
      timestamp: new Date().toISOString(),
      source: 'quiz_landing'
    };

    try {
      const response = await fetch('https://httpbin.org/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Network error');

      trackEvent('lead_form_submitted', {
        phone_masked: phone.slice(0, 7) + '***',
        answers: answers
      });

      // Redirect to thank you
      window.location.href = 'thank-you.html';

    } catch (err) {
      console.error('Submit error:', err);

      // Show error
      networkError.classList.add('visible');
      submitBtn.classList.remove('btn-loading');
      submitBtn.innerHTML = `
        <svg class="form-submit-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
        </svg>
        Получить расчёт в Telegram`;
      submitBtn.disabled = false;
    }
  });
});
