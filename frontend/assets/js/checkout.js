import { formatCurrency } from './data.js';
import { apiFetch, escapeHtml, miniArt, observeReveal, renderShell } from './common.js?v=chat-icon-1';

renderShell('cart');

const root = document.querySelector('#checkoutRoot');
const mode = document.body.dataset.checkout || 'form';
const previewShipping = 30000;
const SELECTED_CART_STORAGE_KEY = 'roomi_selected_cart_items';

function readSelectedCartItemIds() {
  const raw = sessionStorage.getItem(SELECTED_CART_STORAGE_KEY);

  if (raw == null) {
    return null;
  }

  try {
    const ids = JSON.parse(raw);
    return (Array.isArray(ids) ? ids : []).map(Number).filter(Number.isFinite);
  } catch (_error) {
    return null;
  }
}

function getCheckoutItems(cart) {
  const selectedIds = readSelectedCartItemIds();

  if (!selectedIds) {
    return cart.items;
  }

  const selectedIdSet = new Set(selectedIds);
  return cart.items.filter((item) => selectedIdSet.has(item.id));
}

function setPaymentLayout(isActive) {
  document.body.classList.toggle('checkout-payment-page', isActive);
  document.body.classList.toggle('checkout-form-page', false);
}

function setFormLayout(isActive) {
  document.body.classList.toggle('checkout-form-page', isActive);
  document.body.classList.toggle('checkout-payment-page', false);
}

function renderLoading(message = 'Đang tải giỏ hàng...') {
  if (!root) return;
  setPaymentLayout(false);
  root.innerHTML = `<section class="container checkout-title-row"><p class="empty-copy">${escapeHtml(message)}</p></section>`;
}

function renderEmpty() {
  if (!root) return;
  setFormLayout(false);
  root.innerHTML = `
    <section class="locked-state container reveal">
      <div>
        <h1>Giỏ hàng đang trống</h1>
        <p>Thêm sản phẩm vào giỏ trước khi thanh toán.</p>
        <a class="btn btn-maroon" href="products.html">Xem sản phẩm</a>
      </div>
    </section>
  `;
  observeReveal();
}

function renderError(error) {
  if (!root) return;
  setFormLayout(false);
  root.innerHTML = `
    <section class="locked-state container">
      <div>
        <h1>Không tải được thanh toán</h1>
        <p>${escapeHtml(error.message || 'Vui lòng thử lại.')}</p>
      </div>
    </section>
  `;
}

function copyValue(value, button) {
  navigator.clipboard?.writeText(value).then(
    () => {
      const previousText = button.textContent;
      button.textContent = 'Đã copy';
      window.setTimeout(() => {
        button.textContent = previousText;
      }, 1200);
    },
    () => {
      button.textContent = 'Copy lỗi';
    },
  );
}

function bindCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => copyValue(button.dataset.copy || '', button));
  });
}

function renderReportPaidAction(order) {
  if (order.paymentReportedAt || order.payment?.reported) {
    return '<button class="btn btn-maroon" type="button" disabled>Đã báo chuyển khoản</button>';
  }

  return `<button class="btn btn-maroon" type="button" data-report-paid="${escapeHtml(order.code)}">Tôi đã chuyển khoản</button>`;
}

function bindReportPaidButton() {
  const button = document.querySelector('[data-report-paid]');

  button?.addEventListener('click', async () => {
    const code = button.dataset.reportPaid;
    const previousText = button.textContent;

    button.disabled = true;
    button.textContent = 'Đang ghi nhận...';

    try {
      const response = await apiFetch(`/orders/${encodeURIComponent(code)}/report-paid`, {
        method: 'POST',
      });

      sessionStorage.removeItem(SELECTED_CART_STORAGE_KEY);
      renderOrderPayment(response.data, { successView: true });
    } catch (error) {
      button.disabled = false;
      button.textContent = error.message || previousText;

      window.setTimeout(() => {
        button.textContent = previousText;
      }, 1800);
    }
  });
}

function renderPaymentRows(order) {
  const payment = order.payment || {};
  const rows = [
    ['Mã đơn hàng', order.code],
    ['Số tiền', formatCurrency(payment.amount || order.total)],
    ['Nội dung chuyển khoản', payment.transferContent],
  ];

  if (payment.configured) {
    rows.splice(1, 0, ['Ngân hàng', payment.bankId], ['Số tài khoản', payment.accountNo], ['Chủ tài khoản', payment.accountName]);
  }

  return rows
    .map(
      ([label, value]) => `
        <div class="payment-info-row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value || 'Chưa cấu hình')}</strong>
          ${value ? `<button type="button" data-copy="${escapeHtml(value)}">Copy</button>` : ''}
        </div>
      `,
    )
    .join('');
}

function renderOrderPayment(order, { successView = false } = {}) {
  if (!root) return;
  setPaymentLayout(true);

  const payment = order.payment || {};
  const qrMarkup = payment.qrUrl
    ? `<img class="vietqr-image" src="${escapeHtml(payment.qrUrl)}" alt="QR chuyá»ƒn khoáº£n Ä‘Æ¡n ${escapeHtml(order.code)}">`
    : `
      <div class="vietqr-missing">
        <strong>Chưa cấu hình tài khoản nhận tiền</strong>
        <p>Điền VIETQR_BANK_ID, VIETQR_ACCOUNT_NO và VIETQR_ACCOUNT_NAME trong backend/.env rồi restart server.</p>
      </div>
    `;

  root.innerHTML = `
    <section class="container checkout-title-row checkout-payment-title reveal">
      <h1>${successView ? 'Đơn hàng đã tạo' : 'Quét mã thanh toán'}</h1>
      <span></span>
    </section>

    <section class="vietqr-section container reveal">
      <div class="vietqr-card">
        <p class="section-kicker">VIETQR</p>
        ${qrMarkup}
        <p class="vietqr-help">QR đã có sẵn số tiền và nội dung chuyển khoản riêng cho đơn này.</p>
      </div>

      <div class="payment-info-card">
        <h2>${successView ? 'Đang chờ đối soát' : 'Thông tin chuyển khoản'}</h2>
        <p>Sau khi chuyển khoản, ROOMI sẽ kiểm tra sao kê theo đúng mã nội dung bên dưới.</p>
        <div class="payment-info-list">
          ${renderPaymentRows(order)}
        </div>
        <div class="payment-actions">
          ${renderReportPaidAction(order)}
          <a class="btn btn-outline" href="products.html">Tiếp tục mua sắm</a>
        </div>
      </div>
    </section>
  `;

  bindCopyButtons();
  bindReportPaidButton();
  observeReveal();
}

function getFormPayload(form) {
  const formData = new FormData(form);

  return {
    name: formData.get('name')?.toString() || '',
    phone: formData.get('phone')?.toString() || '',
    email: formData.get('email')?.toString() || '',
    address: formData.get('address')?.toString() || '',
    note: formData.get('note')?.toString() || '',
    cartItemIds: readSelectedCartItemIds() || undefined,
  };
}

function bindCheckoutForm() {
  const form = root?.querySelector('[data-checkout-form]');
  const submitButton = form?.querySelector('[type="submit"]');
  const notice = form?.querySelector('[data-checkout-notice]');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (notice) {
      notice.textContent = '';
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Đang tạo QR...';
    }

    try {
      const response = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(getFormPayload(form)),
      });

      renderOrderPayment(response.data);
    } catch (error) {
      if (notice) {
        notice.textContent = error.message || 'Không tạo được đơn hàng.';
      }

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Chuyển khoản VietQR';
      }
    }
  });
}

function renderCheckout(cart) {
  if (!root) return;
  setFormLayout(true);

  if (cart.items.length === 0) {
    renderEmpty();
    return;
  }

  const checkoutItems = getCheckoutItems(cart);

  if (checkoutItems.length === 0) {
    root.innerHTML = `
      <section class="locked-state container reveal">
        <div>
          <h1>Chưa chọn sản phẩm</h1>
          <p>Quay lại giỏ hàng và tick vào sản phẩm bạn muốn thanh toán trước.</p>
          <a class="btn btn-maroon" href="cart.html">Quay lại giỏ hàng</a>
        </div>
      </section>
    `;
    observeReveal();
    return;
  }

  const shippingFee = Number.isFinite(Number(cart.shippingFee)) ? Number(cart.shippingFee) : previewShipping;
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + shippingFee;
  const itemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);

  root.innerHTML = `
    <section class="checkout-band checkout-form-band reveal">
      <div class="checkout-inner container">
        <h2>Thông tin giao hàng</h2>
        <form data-checkout-form>
          <input class="roomi-input" name="name" autocomplete="name" placeholder="Họ và tên" required>
          <input class="roomi-input" name="phone" type="tel" autocomplete="tel" placeholder="Số điện thoại" required>
          <input class="roomi-input" name="email" type="email" autocomplete="email" placeholder="Email">
          <input class="roomi-input" name="address" autocomplete="street-address" placeholder="Địa chỉ nhận hàng" required>
          <textarea class="roomi-input" name="note" rows="3" placeholder="Ghi chú đơn hàng"></textarea>

          <div class="payment-row">
            <span>Thanh toán</span>
            <button class="btn btn-maroon payment-submit" type="submit">Chuyển khoản VietQR</button>
            <p class="checkout-notice" data-checkout-notice></p>
          </div>
        </form>
      </div>
    </section>

    <section class="checkout-review container reveal">
      <div class="checkout-review-head">
        <h2>Sản phẩm trong đơn</h2>
        <span>${itemCount} sản phẩm</span>
      </div>
      <div class="checkout-product">
        ${checkoutItems
          .map(
            (item) => `
              <div class="checkout-row">
                <div class="cart-product">
                  ${miniArt(item.product.name, item.product.imageUrl)}
                  <strong>${escapeHtml(item.product.name)}</strong>
                </div>
                <span>${formatCurrency(item.product.price)}</span>
                <span>x${item.quantity}</span>
                <strong>${formatCurrency(item.total)}</strong>
              </div>
            `,
          )
          .join('')}
      </div>
    </section>

    <section class="checkout-meta">
      <div>
        <strong>Phí vận chuyển</strong>
        <p>${formatCurrency(shippingFee)}</p>
      </div>
      <div>
        <strong>Ghi chú</strong>
        <p>Đơn hàng sẽ được giữ ở trạng thái chờ thanh toán cho đến khi ROOMI đối soát chuyển khoản.</p>
      </div>
    </section>
    <section class="checkout-total">
      <div class="container">
        Tổng thanh toán <strong>${formatCurrency(total)}</strong>
      </div>
    </section>
  `;

  bindCheckoutForm();
  observeReveal();
}

async function renderSuccess() {
  const code = new URLSearchParams(window.location.search).get('code');

  if (!code) {
    if (!root) return;
    root.innerHTML = `
      <section class="locked-state container reveal">
        <div>
          <p class="section-kicker">ORDER CREATED</p>
          <h1>Đơn hàng đã được tạo</h1>
          <p>ROOMI sẽ kiểm tra thanh toán và liên hệ xác nhận đơn hàng.</p>
          <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-top:32px">
            <a class="btn btn-maroon" href="products.html">Tiếp tục mua sắm</a>
            <a class="btn btn-outline" href="index.html">Về trang chủ</a>
          </div>
        </div>
      </section>
    `;
    observeReveal();
    return;
  }

  renderLoading('Đang tải thông tin đơn hàng...');

  try {
    const response = await apiFetch(`/orders/${encodeURIComponent(code)}`);
    renderOrderPayment(response.data, { successView: true });
  } catch (error) {
    renderError(error);
  }
}

async function init() {
  if (mode === 'success') {
    await renderSuccess();
    return;
  }

  renderLoading();

  try {
    const response = await apiFetch('/cart');
    renderCheckout(response.data);
  } catch (error) {
    renderError(error);
  }
}

init();
