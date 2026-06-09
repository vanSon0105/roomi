import {
  apiFetch,
  escapeHtml,
  formatCurrency,
  formatDate,
  paymentMethodLabel,
  orderStatusOptions,
  paymentStatusBadge,
  paymentStatusOptions,
  renderAdminEmpty,
  renderAdminError,
  renderAdminShell,
  renderPagination,
  statusBadge,
} from './admin-common.js?v=admin-sepay-1';

renderAdminShell('orders');

const root = document.querySelector('#adminOrders');
const params = new URLSearchParams(window.location.search);
let state = {
  page: Number(params.get('page') || 1),
  search: params.get('search') || '',
  status: params.get('status') || '',
  paymentStatus: params.get('paymentStatus') || '',
};

function buildQuery() {
  const query = new URLSearchParams({
    page: String(state.page),
    limit: '14',
  });

  if (state.search) query.set('search', state.search);
  if (state.status) query.set('status', state.status);
  if (state.paymentStatus) query.set('paymentStatus', state.paymentStatus);

  return query;
}

function pushState() {
  const query = buildQuery();
  window.history.replaceState(null, '', `orders.html?${query.toString()}`);
}

function renderFilters() {
  return `
    <form class="admin-filters" data-order-filters>
      <label>
        <span>Tìm đơn hàng</span>
        <input name="search" type="search" value="${escapeHtml(state.search)}" placeholder="Mã đơn, SĐT, tên khách">
      </label>
      <label>
        <span>Trạng thái đơn</span>
        <select name="status">
          <option value="">Tất cả đơn</option>
          ${orderStatusOptions(state.status)}
        </select>
      </label>
      <label>
        <span>Thanh toán</span>
        <select name="paymentStatus">
          <option value="">Tất cả thanh toán</option>
          ${paymentStatusOptions(state.paymentStatus)}
        </select>
      </label>
      <button class="admin-primary-link" type="submit">Lọc đơn</button>
    </form>
  `;
}

function renderOrderRows(orders) {
  if (!orders.length) {
    return renderAdminEmpty('Không tìm thấy đơn hàng phù hợp.');
  }

  return `
    <div class="admin-table admin-orders-table">
      <div class="admin-table-head">
        <span>Mã đơn</span>
        <span>Khách hàng</span>
        <span>Tổng tiền</span>
        <span>Thanh toán</span>
        <span>Trạng thái</span>
        <span></span>
      </div>
      ${orders
        .map(
          (order) => `
            <article class="admin-table-row" data-order-row="${escapeHtml(order.code)}">
              <div>
                <strong>${escapeHtml(order.code)}</strong>
                <small>${formatDate(order.createdAt)}</small>
              </div>
              <div>
                <strong>${escapeHtml(order.recipientName)}</strong>
                <small>${escapeHtml(order.recipientPhone)}</small>
              </div>
              <strong>${formatCurrency(order.total)}</strong>
              <div>
                ${paymentStatusBadge(order)}
                <small>${escapeHtml(paymentMethodLabel(order.paymentMethod))}</small>
                <select data-payment-status="${escapeHtml(order.code)}">${paymentStatusOptions(order.paymentStatus, { order })}</select>
              </div>
              <div>
                ${statusBadge('order', order.status)}
                <select data-order-status="${escapeHtml(order.code)}">${orderStatusOptions(order.status)}</select>
              </div>
              <button class="admin-row-button" type="button" data-order-detail="${escapeHtml(order.code)}">Chi tiết</button>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderOrders(data) {
  root.innerHTML = `
    <div class="admin-page-head">
      <div>
        <h1>Đơn hàng</h1>
        <p>Tìm kiếm, đối soát và cập nhật luồng xử lý đơn.</p>
      </div>
      <span class="admin-count">${data.pagination.total} đơn</span>
    </div>
    ${renderFilters()}
    <section class="admin-panel">
      ${renderOrderRows(data.items || [])}
      ${renderPagination(data.pagination, 'orders-page')}
    </section>
    <aside class="admin-drawer" data-order-drawer aria-hidden="true"></aside>
  `;
}

function renderOrderDetail(order) {
  const drawer = document.querySelector('[data-order-drawer]');
  if (!drawer) return;

  drawer.innerHTML = `
    <button class="admin-drawer-close" type="button" data-drawer-close>&times;</button>
    <div class="admin-drawer-head">
      <span>Đơn hàng</span>
      <h2>${escapeHtml(order.code)}</h2>
      <p>${escapeHtml(order.recipientName)} - ${escapeHtml(order.recipientPhone)}</p>
    </div>
    <div class="admin-drawer-grid">
      <div>
        <span>Thanh toán</span>
        ${paymentStatusBadge(order)}
      </div>
      <div>
        <span>Phương thức</span>
        <strong>${escapeHtml(paymentMethodLabel(order.paymentMethod))}</strong>
      </div>
      <div>
        <span>Trạng thái</span>
        ${statusBadge('order', order.status)}
      </div>
      <div>
        <span>Tổng tiền</span>
        <strong>${formatCurrency(order.total)}</strong>
      </div>
      <div>
        <span>Ngày tạo</span>
        <strong>${formatDate(order.createdAt)}</strong>
      </div>
    </div>
    <div class="admin-drawer-section">
      <h3>Sản phẩm</h3>
      ${(order.items || [])
        .map(
          (item) => `
            <div class="admin-drawer-item">
              <span>${escapeHtml(item.productName)}</span>
              <strong>x${item.quantity}</strong>
              <b>${formatCurrency(item.totalPrice)}</b>
            </div>
          `,
        )
        .join('')}
    </div>
    <div class="admin-drawer-section">
      <h3>Giao hàng</h3>
      <p>${escapeHtml(order.shippingLine1 || '')}</p>
      <p>${escapeHtml(order.note || '')}</p>
    </div>
  `;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
}

async function loadOrders() {
  if (!root) return;
  root.innerHTML = '<div class="admin-loading">Đang tải đơn hàng...</div>';

  try {
    const response = await apiFetch(`/admin/orders?${buildQuery().toString()}`);
    renderOrders(response.data);
    pushState();
  } catch (error) {
    root.innerHTML = renderAdminError(error);
  }
}

async function patchOrder(code, body, target) {
  const previousDisabled = target.disabled;
  target.disabled = true;

  try {
    await apiFetch(`/admin/orders/${encodeURIComponent(code)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    await loadOrders();
  } catch (error) {
    target.disabled = previousDisabled;
    window.alert(error.message || 'Không cập nhật được đơn hàng.');
  }
}

root?.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-order-filters]');
  if (!form) return;

  event.preventDefault();
  const formData = new FormData(form);
  state = {
    page: 1,
    search: formData.get('search')?.toString().trim() || '',
    status: formData.get('status')?.toString() || '',
    paymentStatus: formData.get('paymentStatus')?.toString() || '',
  };
  loadOrders();
});

root?.addEventListener('click', async (event) => {
  const pageButton = event.target.closest('[data-orders-page]');
  const detailButton = event.target.closest('[data-order-detail]');
  const closeButton = event.target.closest('[data-drawer-close]');

  if (pageButton) {
    state.page = Number(pageButton.dataset.ordersPage || 1);
    loadOrders();
    return;
  }

  if (detailButton) {
    detailButton.disabled = true;
    try {
      const response = await apiFetch(`/admin/orders/${encodeURIComponent(detailButton.dataset.orderDetail)}`);
      renderOrderDetail(response.data);
    } catch (error) {
      window.alert(error.message || 'Không tải được chi tiết đơn.');
    } finally {
      detailButton.disabled = false;
    }
    return;
  }

  if (closeButton) {
    const drawer = event.target.closest('[data-order-drawer]');
    drawer?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true');
  }
});

root?.addEventListener('change', (event) => {
  const orderStatus = event.target.closest('[data-order-status]');
  const paymentStatus = event.target.closest('[data-payment-status]');

  if (orderStatus) {
    patchOrder(orderStatus.dataset.orderStatus, { status: orderStatus.value }, orderStatus);
    return;
  }

  if (paymentStatus) {
    patchOrder(paymentStatus.dataset.paymentStatus, { paymentStatus: paymentStatus.value }, paymentStatus);
  }
});

loadOrders();
