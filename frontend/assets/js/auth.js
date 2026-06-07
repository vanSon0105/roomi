import { apiFetch, observeReveal } from './common.js?v=nav-public-1';

const form = document.querySelector('[data-auth-form]');
const notice = document.querySelector('[data-auth-notice]');
const page = document.body.dataset.page || 'login';

function safeRedirectOf(value) {
  return value && !value.includes('://') && !value.startsWith('//') ? value : 'index.html';
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
        throw new Error('Mật khẩu nhập lại không khớp');
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
        ? 'Đăng ký thành công, đang chuyển trang...'
        : 'Đăng nhập thành công, đang chuyển trang...';
    }

    window.location.href = safeRedirect;
  } catch (error) {
    if (notice) {
      notice.textContent = error.message;
    }
  }
});

observeReveal();
