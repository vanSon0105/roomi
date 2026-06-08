import { apiFetch, escapeHtml, mediaUrl, observeReveal, renderShell } from './common.js?v=pages-path-1';

renderShell('account');

const root = document.querySelector('#accountRoot');

function dateInputValue(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function avatarMarkup(user) {
  const avatarSrc = user.avatarUrl ? mediaUrl(user.avatarUrl) : '';

  return `
    <div class="account-avatar-preview" data-avatar-preview>
      ${
        avatarSrc
          ? `<img src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(user.name || 'Avatar')}">`
          : '<i class="ph-fill ph-user"></i>'
      }
    </div>
  `;
}

function renderLoading() {
  if (!root) return;
  root.innerHTML = '<section class="account-page container"><p class="empty-copy">Đang tải tài khoản...</p></section>';
}

function renderError(error) {
  if (!root) return;
  root.innerHTML = `
    <section class="locked-state container">
      <div>
        <h1>Không tải được tài khoản</h1>
        <p>${escapeHtml(error.message || 'Vui lòng thử lại.')}</p>
      </div>
    </section>
  `;
}

function renderAccount(user) {
  if (!root) return;

  root.innerHTML = `
    <section class="account-page container reveal">
      <div class="section-title account-title">
        <h1>Tài khoản</h1>
        <p>Quản lý thông tin cá nhân, ảnh đại diện và dữ liệu liên hệ.</p>
      </div>

      <div class="account-shell">
        <aside class="account-summary">
          ${avatarMarkup(user)}
          <strong>${escapeHtml(user.name || 'ROOMI user')}</strong>
          <span>${escapeHtml(user.email || '')}</span>
          <small>${escapeHtml(user.role === 'ADMIN' ? 'Admin' : 'Khách hàng')}</small>
          <button class="account-logout" type="button" data-account-logout>Đăng xuất</button>
        </aside>

        <form class="account-form" data-account-form>
          <label>
            <span>Tên hiển thị</span>
            <input class="roomi-input" name="name" value="${escapeHtml(user.name || '')}" required>
          </label>
          <label>
            <span>Số điện thoại</span>
            <input class="roomi-input" name="phone" type="tel" value="${escapeHtml(user.phone || '')}">
          </label>
          <label>
            <span>Ngày sinh</span>
            <input class="roomi-input" name="birthday" type="date" value="${dateInputValue(user.birthday)}">
          </label>
          <label>
            <span>Ảnh đại diện</span>
            <input class="roomi-input" name="avatarUrl" value="${escapeHtml(user.avatarUrl || '')}" placeholder="link ảnh đại diện">
          </label>
          <div class="account-actions">
            <button class="btn btn-maroon" type="submit">Lưu thay đổi</button>
            <p class="account-notice" data-account-notice></p>
          </div>
        </form>
      </div>
    </section>
  `;

  bindFormPreview();
  observeReveal();
}

function bindFormPreview() {
  const input = root?.querySelector('[name="avatarUrl"]');
  const preview = root?.querySelector('[data-avatar-preview]');

  input?.addEventListener('input', () => {
    const value = input.value.trim();
    preview.innerHTML = value
      ? `<img src="${escapeHtml(mediaUrl(value))}" alt="Avatar preview">`
      : '<i class="ph-fill ph-user"></i>';
  });
}

async function loadAccount() {
  renderLoading();

  try {
    const response = await apiFetch('/users/me');
    renderAccount(response.data);
  } catch (error) {
    if (error.status === 401) {
      window.location.href = `login.html?redirect=${encodeURIComponent('account.html')}`;
      return;
    }

    renderError(error);
  }
}

root?.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-account-form]');
  if (!form) return;

  event.preventDefault();

  const button = form.querySelector('[type="submit"]');
  const notice = form.querySelector('[data-account-notice]');
  const formData = new FormData(form);
  const payload = {
    name: formData.get('name')?.toString().trim() || '',
    phone: formData.get('phone')?.toString().trim() || null,
    birthday: formData.get('birthday')?.toString() || null,
    avatarUrl: formData.get('avatarUrl')?.toString().trim() || null,
  };

  if (notice) notice.textContent = '';
  if (button) {
    button.disabled = true;
    button.textContent = 'Đang lưu...';
  }

  try {
    const response = await apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    renderAccount(response.data);
    const nextNotice = root?.querySelector('[data-account-notice]');
    if (nextNotice) nextNotice.textContent = 'Đã cập nhật tài khoản.';
  } catch (error) {
    if (notice) notice.textContent = error.message || 'Không lưu được tài khoản.';
    if (button) {
      button.disabled = false;
      button.textContent = 'Lưu thay đổi';
    }
  }
});

root?.addEventListener('click', async (event) => {
  const logoutButton = event.target.closest('[data-account-logout]');
  if (!logoutButton) return;

  logoutButton.disabled = true;
  logoutButton.textContent = 'Đang đăng xuất...';

  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    sessionStorage.removeItem('roomi_selected_cart_items');
    window.location.href = 'login.html';
  }
});

loadAccount();
