import { AUTH_KEY, observeReveal, renderShell } from './common.js?v=nav-public-1';

renderShell(document.body.dataset.page || 'login');

const form = document.querySelector('[data-auth-form]');
const notice = document.querySelector('[data-auth-notice]');

form?.addEventListener('submit', (event) => {
  event.preventDefault();

  try {
    window.localStorage.setItem(AUTH_KEY, 'true');
  } catch {
    // Static demo only. If storage is blocked, stay on the page with a notice.
  }

  const redirect = new URLSearchParams(window.location.search).get('redirect');
  const safeRedirect = redirect && !redirect.includes('://') && !redirect.startsWith('//') ? redirect : 'index.html';

  if (notice) {
    notice.textContent = 'Đăng nhập thành công, đang chuyển trang...';
  }

  window.location.href = safeRedirect;
});

observeReveal();
