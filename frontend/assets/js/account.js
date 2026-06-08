import { API_BASE, apiFetch, escapeHtml, mediaUrl, observeReveal, renderShell } from './common.js?v=pages-path-1';

renderShell('account');

const root = document.querySelector('#accountRoot');
let avatarPreviewObjectUrl = null;

function dateInputValue(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toISOString().slice(0, 10);
}

function avatarMarkup(user) {
  const avatarSrc = user.avatarUrl ? mediaUrl(user.avatarUrl) : '';

  return `
    <div class="account-avatar-preview" data-avatar-preview data-current-avatar="${escapeHtml(avatarSrc)}">
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
          <label class="account-avatar-picker">
            <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-avatar-file>
            <span>Thay đổi ảnh</span>
          </label>
          <p class="account-avatar-file-name" data-avatar-file-name hidden></p>
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
            <span>Email</span>
            <input class="roomi-input account-readonly-input" name="email" type="email" value="${escapeHtml(user.email || '')}" readonly aria-readonly="true">
          </label>
          <label>
            <span>Ngày sinh</span>
            <input class="roomi-input" name="birthday" type="date" value="${dateInputValue(user.birthday)}">
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
  const input = root?.querySelector('[data-avatar-file]');
  const preview = root?.querySelector('[data-avatar-preview]');
  const fileName = root?.querySelector('[data-avatar-file-name]');

  if (avatarPreviewObjectUrl) {
    URL.revokeObjectURL(avatarPreviewObjectUrl);
    avatarPreviewObjectUrl = null;
  }

  input?.addEventListener('change', () => {
    const file = input.files?.[0];

    if (avatarPreviewObjectUrl) {
      URL.revokeObjectURL(avatarPreviewObjectUrl);
      avatarPreviewObjectUrl = null;
    }

    if (!file) {
      const currentAvatar = preview?.dataset.currentAvatar || '';

      if (preview) {
        preview.innerHTML = currentAvatar
          ? `<img src="${escapeHtml(currentAvatar)}" alt="Avatar preview">`
          : '<i class="ph-fill ph-user"></i>';
      }

      if (fileName) {
        fileName.textContent = '';
        fileName.hidden = true;
      }
      return;
    }

    avatarPreviewObjectUrl = URL.createObjectURL(file);

    if (preview) {
      preview.innerHTML = `<img src="${escapeHtml(avatarPreviewObjectUrl)}" alt="Avatar preview">`;
    }

    if (fileName) {
      fileName.textContent = file.name;
      fileName.hidden = false;
    }
  });
}

async function uploadAvatar(file) {
  const body = new FormData();
  body.append('avatar', file);

  const response = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    credentials: 'include',
    body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || 'Không tải được ảnh đại diện.');
    error.status = response.status;
    error.data = payload?.data || null;
    throw error;
  }

  return payload;
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
  const avatarFile = root?.querySelector('[data-avatar-file]')?.files?.[0] || null;
  const payload = {
    name: formData.get('name')?.toString().trim() || '',
    phone: formData.get('phone')?.toString().trim() || null,
    birthday: formData.get('birthday')?.toString() || null,
  };

  if (notice) notice.textContent = '';

  if (avatarFile && avatarFile.size > 3 * 1024 * 1024) {
    if (notice) notice.textContent = 'Ảnh đại diện tối đa 3MB.';
    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent = 'Đang lưu...';
  }

  try {
    let response = await apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (avatarFile) {
      response = await uploadAvatar(avatarFile);
    }

    renderShell('account');
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
