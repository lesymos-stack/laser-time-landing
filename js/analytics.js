/* === Analytics — Yandex.Metrika events === */

// Stub ym() if Metrika is not connected
window.ym = window.ym || function() {};
const YM_ID = 'XXXXXXXX'; // Replace with real ID

/**
 * Track an analytics event
 * @param {string} eventName
 * @param {object} [params]
 */
function trackEvent(eventName, params) {
  // Yandex.Metrika
  try {
    ym(YM_ID, 'reachGoal', eventName, params || {});
  } catch (e) { /* no-op */ }

  // Console log for debugging
  console.log('[Analytics]', eventName, params || '');
}

/**
 * Track time spent on a quiz step
 * @param {number} step
 * @param {number} durationMs
 */
function trackStepDuration(step, durationMs) {
  trackEvent('quiz_step_duration', {
    step: step,
    duration_sec: Math.round(durationMs / 1000)
  });
}

// Track scroll depth to quiz
(function() {
  let scrollTracked = false;
  const checkScroll = () => {
    if (scrollTracked) return;
    const quiz = document.getElementById('quiz-section');
    if (!quiz) return;
    const rect = quiz.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      scrollTracked = true;
      trackEvent('scroll_to_quiz');
      window.removeEventListener('scroll', checkScroll);
    }
  };
  window.addEventListener('scroll', checkScroll, { passive: true });
})();
