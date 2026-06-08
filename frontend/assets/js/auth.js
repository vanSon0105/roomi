import { apiFetch, homeHref, observeReveal } from './common.js?v=pages-path-1';

const form = document.querySelector('[data-auth-form]');
const notice = document.querySelector('[data-auth-notice]');
const page = document.body.dataset.page || 'login';

const errorMessages = new Map([
  ['Validation failed', 'Thông tin chưa hợp lệ'],
  ['Invalid username/email or password', 'Tên đăng nhập/email hoặc mật khẩu không đúng'],
  ['Email already exists', 'Email này đã được đăng ký'],
  ['Phone already exists', 'Số điện thoại này đã được đăng ký'],
  ['Request failed', 'Không thể gửi yêu cầu, vui lòng thử lại'],
]);

const fieldLabels = new Map([
  ['identifier', 'Tên đăng nhập/email'],
  ['name', 'Tên đăng nhập'],
  ['email', 'Email'],
  ['phone', 'Số điện thoại'],
  ['password', 'Mật khẩu'],
  ['confirmPassword', 'Nhập lại mật khẩu'],
]);

function setNotice(message = '', type = 'error') {
  if (!notice) return;

  notice.textContent = message;
  notice.classList.remove('is-error', 'is-success');

  if (message) {
    notice.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }
}

function normalizeErrorMessage(error) {
  if (Array.isArray(error?.data) && error.data.length > 0) {
    return error.data
      .map((issue) => {
        const field = String(issue.field || '').replace(/^body\./, '');
        const label = fieldLabels.get(field);
        const message = errorMessages.get(issue.message) || issue.message || 'Chưa hợp lệ';

        return label && !message.startsWith(label) ? `${label}: ${message}` : message;
      })
      .join('\n');
  }

  const message = error?.message || 'Có lỗi xảy ra, vui lòng thử lại';

  return errorMessages.get(message) || message;
}

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

  setNotice('');

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

    setNotice(
      page === 'register'
        ? 'Đăng ký thành công, đang chuyển trang...'
        : 'Đăng nhập thành công, đang chuyển trang...',
      'success',
    );

    window.location.href = safeRedirect;
  } catch (error) {
    setNotice(normalizeErrorMessage(error), 'error');
  }
});

observeReveal();
