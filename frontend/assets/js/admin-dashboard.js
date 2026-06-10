import {
  apiFetch,
  escapeHtml,
  formatCurrency,
  formatDate,
  mediaUrl,
  paymentMethodLabel,
  paymentStatusBadge,
  renderAdminError,
  renderAdminShell,
  statusBadge,
} from './admin-common.js?v=admin-sepay-1';

renderAdminShell('dashboard');

const root = document.querySelector('#adminDashboard');

function statCard(label, value, note) {
  return `
    <article class="admin-stat">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(note)}</small>
    </article>
  `;
}

function renderDashboard(data) {
  const cards = data.cards || {};

  root.innerHTML = `
    <div class="admin-page-head">
      <div>
        <h1>Tổng quan</h1>
        <p>Theo dõi đơn, thanh toán, tồn kho và người dùng</p>
      </div>
      <a class="admin-primary-link" href="orders.html">Xem đơn hàng</a>
    </div>

    <section class="admin-stat-grid">
      ${statCard('Đơn hôm nay', String(cards.todayOrders || 0), `${cards.totalOrders || 0} đơn toàn hệ thống`)}
      ${statCard('Chờ thanh toán', String(cards.pendingPayment || 0), 'Đơn đang chờ xác nhận')}
      ${statCard('Doanh thu hôm nay', formatCurrency(cards.todayRevenue || 0), `Đã xác nhận: ${formatCurrency(cards.revenue || 0)}`)}
    </section>

    <section class="admin-grid-2">
      <div class="admin-panel">
        <div class="admin-panel-head">
          <h2>Đơn mới nhất</h2>
          <a href="orders.html">Mở bảng đơn</a>
        </div>
        <div class="admin-list">
          ${(data.latestOrders || [])
            .map(
              (order) => `
                <a class="admin-list-row" href="orders.html?search=${encodeURIComponent(order.code)}">
                  <div>
                    <strong>${escapeHtml(order.code)}</strong>
                    <span>${escapeHtml(order.recipientName)} - ${escapeHtml(order.recipientPhone)}</span>
                  </div>
                  <div>
                    <strong>${formatCurrency(order.total)}</strong>
                    ${paymentStatusBadge(order)}
                    <span>${escapeHtml(paymentMethodLabel(order.paymentMethod))}</span>
                  </div>
                </a>
              `,
            )
            .join('') || '<p class="admin-muted">Chưa có đơn hàng.</p>'}
        </div>
      </div>

      <div class="admin-panel">
        <div class="admin-panel-head">
          <h2>Sản phẩm sắp hết</h2>
          <a href="products.html">Quản lý kho</a>
        </div>
        <div class="admin-list">
          ${(data.lowStockProducts || [])
            .map(
              (product) => `
                <a class="admin-list-row" href="products.html?search=${encodeURIComponent(product.slug)}">
                  <div class="admin-product-mini">
                    <span class="admin-thumb">${product.imageUrl ? `<img src="${mediaUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}">` : ''}</span>
                    <div>
                      <strong>${escapeHtml(product.name)}</strong>
                      <span>Còn ${Number(product.stock || 0)} sản phẩm</span>
                    </div>
                  </div>
                  ${statusBadge('product', product.status)}
                </a>
              `,
            )
            .join('') || '<p class="admin-muted">Không có sản phẩm tồn thấp.</p>'}
        </div>
      </div>
    </section>

    <section class="admin-panel">
      <div class="admin-panel-head">
        <h2>Sản phẩm bán chạy</h2>
        <span>${formatDate(new Date())}</span>
      </div>
      <div class="admin-ranking">
        ${(data.topProducts || [])
          .map(
            (item, index) => `
              <div class="admin-rank-row">
                <span>${String(index + 1).padStart(2, '0')}</span>
                <strong>${escapeHtml(item.productName)}</strong>
                <small>${item.quantity} sản phẩm</small>
                <b>${formatCurrency(item.revenue)}</b>
              </div>
            `,
          )
          .join('') || '<p class="admin-muted">Chưa có dữ liệu bán chạy.</p>'}
      </div>
    </section>
  `;
}

async function init() {
  if (!root) return;
  root.innerHTML = '<div class="admin-loading">Đang tải dashboard...</div>';

  try {
    const response = await apiFetch('/admin/stats');
    renderDashboard(response.data);
  } catch (error) {
    root.innerHTML = renderAdminError(error);
  }
}

init();
