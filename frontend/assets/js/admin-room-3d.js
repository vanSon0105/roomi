import {
  apiFetch,
  escapeHtml,
  formatCurrency,
  formatDate,
  renderAdminError,
  renderAdminShell,
} from './admin-common.js?v=admin-room3d-1';

renderAdminShell('room-3d');

const root = document.querySelector('#adminRoom3d');

function renderLatestAccesses(items = []) {
  if (!items.length) {
    return '<p class="admin-muted">Chưa có khách nào mở khóa mô phỏng 3D.</p>';
  }

  return `
    <div class="admin-table admin-room3d-table">
      <div class="admin-table-head">
        <span>Khách hàng</span>
        <span>Đơn hàng</span>
        <span>Số tiền</span>
        <span>Ngày mở khóa</span>
      </div>
      ${items
        .map(
          (item) => `
            <article class="admin-table-row">
              <div>
                <strong>${escapeHtml(item.user?.name || 'Khách hàng')}</strong>
                <small>${escapeHtml(item.user?.email || item.user?.phone || '')}</small>
              </div>
              <div>
                <strong>${escapeHtml(item.order?.code || 'Mở khóa miễn phí')}</strong>
                <small>${escapeHtml(item.order?.paymentStatus || '')}</small>
              </div>
              <strong>${formatCurrency(item.pricePaid || item.order?.total || 0)}</strong>
              <span>${formatDate(item.grantedAt)}</span>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderRoom3D(data) {
  root.innerHTML = `
    <div class="admin-page-head">
      <div>
        <h1>Mô phỏng 3D</h1>
        <p>Đặt giá mở khóa trang xem 3D. Nếu giá bằng 0đ, người dùng đã đăng nhập được xem miễn phí.</p>
      </div>
      <span class="admin-count">${formatCurrency(data.price || 0)}</span>
    </div>

    <section class="admin-stat-grid">
      <article class="admin-stat">
        <span>Giá hiện tại</span>
        <strong>${formatCurrency(data.price || 0)}</strong>
        <small>${Number(data.price || 0) > 0 ? 'Đang yêu cầu thanh toán' : 'Đang mở miễn phí'}</small>
      </article>
      <article class="admin-stat">
        <span>Đã mở khóa</span>
        <strong>${Number(data.accessCount || 0)}</strong>
        <small>Tổng số tài khoản có quyền xem 3D</small>
      </article>
    </section>

    <form class="admin-settings-form" data-room3d-form>
      <section class="admin-panel">
        <h2>Cấu hình giá</h2>
        <label>
          <span>Giá xem 3D</span>
          <input name="price" type="number" min="0" step="1000" value="${Number(data.price || 0)}" placeholder="VD: 49000">
          <small>Để 0 nếu muốn mở miễn phí trong giai đoạn test.</small>
        </label>
      </section>
      <button class="btn btn-maroon" type="submit">Lưu giá 3D</button>
      <span class="admin-settings-feedback" data-room3d-feedback></span>
    </form>

    <section class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <span>Lịch sử</span>
          <h2>Mở khóa gần đây</h2>
        </div>
      </div>
      ${renderLatestAccesses(data.latestAccesses || [])}
    </section>
  `;
}

async function loadRoom3D() {
  if (!root) return;
  root.innerHTML = '<div class="admin-loading">Đang tải cấu hình 3D...</div>';

  try {
    const response = await apiFetch('/admin/room3d');
    renderRoom3D(response.data);
  } catch (error) {
    root.innerHTML = renderAdminError(error);
  }
}

root?.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-room3d-form]');
  if (!form) return;

  event.preventDefault();

  const feedback = form.querySelector('[data-room3d-feedback]');
  const submitButton = form.querySelector('[type="submit"]');
  const formData = new FormData(form);

  submitButton.disabled = true;
  submitButton.textContent = 'Đang lưu...';
  if (feedback) feedback.textContent = '';

  try {
    const response = await apiFetch('/admin/room3d', {
      method: 'PUT',
      body: JSON.stringify({
        price: Number(formData.get('price') || 0),
      }),
    });

    renderRoom3D(response.data);
  } catch (error) {
    if (feedback) feedback.textContent = error.message || 'Không lưu được giá 3D.';
    submitButton.disabled = false;
    submitButton.textContent = 'Lưu giá 3D';
  }
});

loadRoom3D();
