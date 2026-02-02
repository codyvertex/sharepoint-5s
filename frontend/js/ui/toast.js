/**
 * Toast Notification Component
 * Non-blocking notifications for app events.
 */

const TOAST_DURATION = 4000;

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'|'warning'} [type='info']
 */
export function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = {
    success: '\u2713',
    error: '\u2717',
    info: '\u2139',
    warning: '\u26A0',
  };

  toast.innerHTML = `
    <span style="font-size:var(--text-lg);flex-shrink:0;">${icons[type] || icons.info}</span>
    <span style="flex:1;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('toast--visible');
  });

  // Auto-remove
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    setTimeout(() => toast.remove(), 300);
  }, TOAST_DURATION);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
