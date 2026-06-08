import { apiFetch, homeHref, observeReveal } from './common.js?v=pages-path-1';

const form = document.querySelector('[data-auth-form]');
const notice = document.querySelector('[data-auth-notice]');
const page = document.body.dataset.page || 'login';

function safeRedirectOf(value) {
  if (!value || value.includes('://') || value.startsWith('//')) {
    return homeHref;
  }

  const normalized = value.replace(/^\/?pages\//, '');
  return normalized === 'index.html' || normalized === '/index.html' ? homeHref : normalized;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const password = formData.get('password')?.toString() || '';

  if (notice) {
    notice.textContent = '';
  }

  try {
    if (page === 'register') {
      const confirmPassword = formData.get('confirmPassword')?.toString() || '';

      if (password !== confirmPassword) {
        throw new Error('Máº­t kháº©u nháº­p láº¡i khÃ´ng khá»›p');
      }

      await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name')?.toString() || '',
          email: formData.get('email')?.toString() || '',
          phone: formData.get('phone')?.toString() || '',
          password,
          confirmPassword,
        }),
      });
    } else {
      await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: formData.get('identifier')?.toString() || '',
          password,
        }),
      });
    }

    const redirect = new URLSearchParams(window.location.search).get('redirect');
    const safeRedirect = safeRedirectOf(redirect);

    if (notice) {
      notice.textContent = page === 'register'
        ? 'ÄÄƒng kÃ½ thÃ nh cÃ´ng, Ä‘ang chuyá»ƒn trang...'
        : 'ÄÄƒng nháº­p thÃ nh cÃ´ng, Ä‘ang chuyá»ƒn trang...';
    }

    window.location.href = safeRedirect;
  } catch (error) {
    if (notice) {
      notice.textContent = error.message;
    }
  }
});

observeReveal();

