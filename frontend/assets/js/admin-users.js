import {
  apiFetch,
  escapeHtml,
  formatDate,
  renderAdminEmpty,
  renderAdminError,
  renderAdminShell,
  renderPagination,
  roleOptions,
  statusBadge,
} from './admin-common.js?v=admin-payment-cancel-1';

renderAdminShell('users');

const root = document.querySelector('#adminUsers');
const params = new URLSearchParams(window.location.search);
let state = {
  page: Number(params.get('page') || 1),
  search: params.get('search') || '',
  role: params.get('role') || 'ALL',
};

function buildQuery() {
  const query = new URLSearchParams({
    page: String(state.page),
    limit: '14',
    role: state.role || 'ALL',
  });
  if (state.search) query.set('search', state.search);
  return query;
}

function renderFilters() {
  return `
    <form class="admin-filters" data-user-filters>
      <label>
        <span>Tìm người dùng</span>
        <input name="search" type="search" value="${escapeHtml(state.search)}" placeholder="Tên, email, SĐT">
      </label>
      <label>
        <span>Vai trò</span>
        <select name="role">${roleOptions(state.role, { includeAll: true })}</select>
      </label>
      <button class="admin-primary-link" type="submit">Lọc người dùng</button>
    </form>
  `;
}

function renderUserRows(users) {
  if (!users.length) {
    return renderAdminEmpty('Không tìm thấy người dùng phù hợp.');
  }

  return `
    <div class="admin-table admin-users-table">
      <div class="admin-table-head">
        <span>Người dùng</span>
        <span>Liên hệ</span>
        <span>Đơn hàng</span>
        <span>Vai trò</span>
        <span>Ngày tạo</span>
        <span></span>
      </div>
      ${users
        .map(
          (user) => `
            <article class="admin-table-row">
              <div>
                <strong>${escapeHtml(user.name)}</strong>
                <small>ID ${user.id}</small>
              </div>
              <div>
                <strong>${escapeHtml(user.email)}</strong>
                <small>${escapeHtml(user.phone || 'Chưa có SĐT')}</small>
              </div>
              <strong>${Number(user.orderCount || 0)}</strong>
              <div>
                ${statusBadge('role', user.role)}
                <select data-user-role="${user.id}">${roleOptions(user.role)}</select>
              </div>
              <span>${formatDate(user.createdAt)}</span>
              <button type="button" data-user-ban="${user.id}" class="admin-ban-btn ${user.isBanned ? 'is-banned' : ''}">${user.isBanned ? 'Mở khoá' : 'Khoá'}</button>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderUsers(data) {
  root.innerHTML = `
    <div class="admin-page-head">
      <div>
        <h1>Người dùng</h1>
        <p>Quản lý tài khoản, vai trò admin và lịch sử mua hàng.</p>
      </div>
      <span class="admin-count">${data.pagination.total} người dùng</span>
    </div>
    ${renderFilters()}
    <section class="admin-panel">
      ${renderUserRows(data.items || [])}
      ${renderPagination(data.pagination, 'users-page')}
    </section>
  `;
}

async function loadUsers() {
  if (!root) return;
  root.innerHTML = '<div class="admin-loading">Đang tải người dùng...</div>';

  try {
    const response = await apiFetch(`/admin/users?${buildQuery().toString()}`);
    renderUsers(response.data);
    window.history.replaceState(null, '', `users.html?${buildQuery().toString()}`);
  } catch (error) {
    root.innerHTML = renderAdminError(error);
  }
}

async function patchUser(id, body, target) {
  target.disabled = true;

  try {
    await apiFetch(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    await loadUsers();
  } catch (error) {
    target.disabled = false;
    window.alert(error.message || 'Không cập nhật được người dùng.');
  }
}

root?.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-user-filters]');
  if (!form) return;

  event.preventDefault();
  const formData = new FormData(form);
  state = {
    page: 1,
    search: formData.get('search')?.toString().trim() || '',
    role: formData.get('role')?.toString() || 'ALL',
  };
  loadUsers();
});

root?.addEventListener('click', (event) => {
  const pageButton = event.target.closest('[data-users-page]');
  if (pageButton) { state.page = Number(pageButton.dataset.usersPage || 1); loadUsers(); return; }

  const banBtn = event.target.closest('[data-user-ban]');
  if (banBtn) {
    const id = Number(banBtn.dataset.userBan);
    const isBanned = banBtn.classList.contains('is-banned');
    if (!window.confirm(isBanned ? `Mở khoá người dùng #${id}?` : `Khoá người dùng #${id}? Họ sẽ không thể đăng nhập.`)) return;
    banBtn.disabled = true;
    patchUser(id, { isBanned: !isBanned }, banBtn);
  }
});

root?.addEventListener('change', (event) => {
  const role = event.target.closest('[data-user-role]');
  if (!role) return;

  patchUser(role.dataset.userRole, { role: role.value }, role);
});

loadUsers();
