import { formatCurrency } from './data.js';

export const API_BASE = '/api';

const adminNav = [
  { id: 'dashboard', label: 'Tổng quan', href: 'dashboard.html', icon: 'ph-squares-four' },
  { id: 'orders', label: 'Đơn hàng', href: 'orders.html', icon: 'ph-receipt' },
  { id: 'products', label: 'Sản phẩm', href: 'products.html', icon: 'ph-package' },
  { id: 'users', label: 'Người dùng', href: 'users.html', icon: 'ph-users-three' },
  { id: 'payment-settings', label: 'Thanh toán', href: 'payment-settings.html', icon: 'ph-credit-card' },
];

const orderStatusLabels = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const paymentStatusLabels = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUNDED: 'Hoàn tiền',
};

const paymentDisplayLabels = {
  ...paymentStatusLabels,
  WAITING_CONFIRMATION: 'Chờ xác nhận',
};

const paymentMethodLabels = {
  BANK_TRANSFER: 'Chuyển khoản',
  COD: 'Thanh toán khi nhận hàng',
  ONLINE: 'Thanh toán online',
  PAYOS: 'Chuyển khoản',
  SEPAY: 'Chuyển khoản',
};

const productStatusLabels = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang bán',
  ARCHIVED: 'Đã ẩn',
};

const roleLabels = {
  USER: 'Khách hàng',
  ADMIN: 'Admin',
};

export { formatCurrency };

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(value) {
  if (!value) return 'Chưa có';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function mediaUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;

  return `../../${path.replace(/^\/+/, '')}`;
}

export function labelOf(type, value) {
  const maps = {
    order: orderStatusLabels,
    payment: paymentDisplayLabels,
    product: productStatusLabels,
    role: roleLabels,
  };

  return maps[type]?.[value] || value || 'Không rõ';
}

export function statusBadge(type, value) {
  const normalized = String(value || 'unknown').toLowerCase().replace(/_/g, '-');
  return `<span class="admin-badge admin-badge--${normalized}">${escapeHtml(labelOf(type, value))}</span>`;
}

export function isPaymentReported(order) {
  return Boolean(order?.paymentReportedAt || order?.payment?.reported || order?.payment?.reportedAt);
}

export function paymentDisplayStatus(order) {
  if (order?.paymentStatus === 'UNPAID' && isPaymentReported(order)) {
    return 'WAITING_CONFIRMATION';
  }

  return order?.paymentStatus || '';
}

export function paymentStatusBadge(order) {
  return statusBadge('payment', paymentDisplayStatus(order));
}

export function paymentMethodLabel(value) {
  return paymentMethodLabels[value] || value || 'Chưa rõ phương thức';
}

export function orderStatusOptions(value) {
  return Object.entries(orderStatusLabels)
    .map(([key, label]) => `<option value="${key}" ${key === value ? 'selected' : ''}>${label}</option>`)
    .join('');
}

export function paymentStatusOptions(value, { order, reported = false } = {}) {
  const isWaitingConfirmation = value === 'UNPAID' && (reported || isPaymentReported(order));

  return Object.entries(paymentStatusLabels)
    .map(([key, label]) => {
      const displayLabel = key === 'UNPAID' && isWaitingConfirmation ? paymentDisplayLabels.WAITING_CONFIRMATION : label;
      return `<option value="${key}" ${key === value ? 'selected' : ''}>${displayLabel}</option>`;
    })
    .join('');
}

export function productStatusOptions(value, { includeAll = false } = {}) {
  const entries = includeAll ? [['ALL', 'Tất cả trạng thái'], ...Object.entries(productStatusLabels)] : Object.entries(productStatusLabels);
  return entries
    .map(([key, label]) => `<option value="${key}" ${key === value ? 'selected' : ''}>${label}</option>`)
    .join('');
}

export function roleOptions(value, { includeAll = false } = {}) {
  const entries = includeAll ? [['ALL', 'Tất cả vai trò'], ...Object.entries(roleLabels)] : Object.entries(roleLabels);
  return entries
    .map(([key, label]) => `<option value="${key}" ${key === value ? 'selected' : ''}>${label}</option>`)
    .join('');
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      const current = `admin/${window.location.pathname.split('/').pop() || 'dashboard.html'}${window.location.search}`;
      window.location.href = `../login.html?redirect=${encodeURIComponent(current)}`;
    }

    const error = new Error(payload?.message || 'Request failed');
    error.status = response.status;
    error.data = payload?.data || null;
    throw error;
  }

  return payload;
}

export function renderAdminShell(activePage = '') {
  const sidebar = document.querySelector('[data-admin-sidebar]');
  const topbar = document.querySelector('[data-admin-topbar]');

  if (sidebar) {
    sidebar.innerHTML = `
      <a class="admin-brand" href="../../index.html" aria-label="ROOMI Admin">
        <img src="../../assets/images/figma/logo-roomi-navbar.png" alt="ROOMI">
        <span>Admin</span>
      </a>
      <nav class="admin-nav" aria-label="Quản trị">
        ${adminNav
          .map(
            (item) => `
              <a class="${item.id === activePage ? 'is-active' : ''}" href="${item.href}">
                <i class="ph ${item.icon}" aria-hidden="true"></i>
                <span>${item.label}</span>
              </a>
            `,
          )
          .join('')}
      </nav>
    `;
  }

  if (topbar) {
    topbar.innerHTML = `
      <form class="admin-command" data-admin-command>
        <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
        <input name="search" type="search" autocomplete="off" placeholder="Tìm mã đơn, số điện thoại, tên khách">
      </form>
      <div class="admin-user" data-admin-user>
        <span>ROOMI Admin</span>
        <button type="button" data-admin-logout>Đăng xuất</button>
      </div>
    `;
  }

  topbar?.querySelector('[data-admin-command]')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get('search')?.toString().trim();
    window.location.href = value ? `orders.html?search=${encodeURIComponent(value)}` : 'orders.html';
  });

  topbar?.querySelector('[data-admin-logout]')?.addEventListener('click', async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '../login.html?redirect=admin/dashboard.html';
    }
  });

  syncAdminUser();
}

async function syncAdminUser() {
  const slot = document.querySelector('[data-admin-user] span');
  if (!slot) return;

  try {
    const response = await apiFetch('/auth/me');
    const user = response.data?.user;
    slot.textContent = user?.name || user?.email || 'ROOMI Admin';
  } catch (_error) {
    // apiFetch handles auth redirects.
  }
}

export function renderAdminEmpty(message, action = '') {
  return `
    <div class="admin-empty">
      <strong>${escapeHtml(message)}</strong>
      ${action}
    </div>
  `;
}

export function renderAdminError(error) {
  return `
    <div class="admin-error">
      <strong>Không tải được dữ liệu</strong>
      <p>${escapeHtml(error.message || 'Vui lòng thử lại.')}</p>
    </div>
  `;
}

export function renderPagination(pagination = {}, onPageName = 'page') {
  const page = Number(pagination.page || 1);
  const totalPages = Number(pagination.totalPages || 1);

  if (totalPages <= 1) {
    return '';
  }

  return `
    <div class="admin-pagination">
      <button type="button" data-${onPageName}="${Math.max(1, page - 1)}" ${page <= 1 ? 'disabled' : ''}>Trước</button>
      <span>Trang ${page}/${totalPages}</span>
      <button type="button" data-${onPageName}="${Math.min(totalPages, page + 1)}" ${page >= totalPages ? 'disabled' : ''}>Sau</button>
    </div>
  `;
}
