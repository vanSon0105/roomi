import { formatCurrency } from './data.js';
import { apiFetch, escapeHtml, homeHref, miniArt, observeReveal, pageHref, renderShell } from './common.js?v=pages-path-1';

renderShell('cart');

const root = document.querySelector('#checkoutRoot');
const mode = document.body.dataset.checkout || 'form';
const previewShipping = 30000;
const SELECTED_CART_STORAGE_KEY = 'roomi_selected_cart_items';
const PAYMENT_POLL_LIMIT_MS = 2 * 60 * 1000;
let paymentPollTimer = null;

function clearPaymentPoll() {
  if (paymentPollTimer) {
    window.clearTimeout(paymentPollTimer);
    paymentPollTimer = null;
  }
}

window.addEventListener('pagehide', clearPaymentPoll);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearPaymentPoll();
  }
});

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
  clearPaymentPoll();
  setPaymentLayout(false);
  root.innerHTML = `<section class="container checkout-title-row"><p class="empty-copy">${escapeHtml(message)}</p></section>`;
}

function renderEmpty() {
  if (!root) return;
  clearPaymentPoll();
  setFormLayout(false);
  root.innerHTML = `
    <section class="locked-state container reveal">
      <div>
        <h1>Giỏ hàng đang trống</h1>
        <p>Thêm sản phẩm vào giỏ trước khi thanh toán.</p>
        <a class="btn btn-maroon" href="${pageHref('products.html')}">Xem sản phẩm</a>
      </div>
    </section>
  `;
  observeReveal();
}

function renderError(error) {
  if (!root) return;
  clearPaymentPoll();
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

function isCashOnDelivery(order) {
  return order.paymentMethod === 'COD' || order.payment?.provider === 'COD';
}

function isPayos(order) {
  return order.paymentMethod === 'PAYOS' || order.payment?.provider === 'PAYOS';
}

function isSepay(order) {
  return order.paymentMethod === 'SEPAY' || order.payment?.provider === 'SEPAY';
}

function renderReportPaidAction(order) {
  if (isCashOnDelivery(order) || isPayos(order) || isSepay(order)) {
    return '';
  }

  if (order.paymentReportedAt || order.payment?.reported) {
    return '<button class="btn btn-maroon" type="button" disabled>Đã báo chuyển khoản</button>';
  }

  return `<button class="btn btn-maroon" type="button" data-report-paid="${escapeHtml(order.code)}">Tôi đã chuyển khoản</button>`;
}

function renderCashOnDeliveryAction(order) {
  if (isCashOnDelivery(order) || isPayos(order) || isSepay(order) || order.paymentReportedAt || order.payment?.reported || order.paymentStatus === 'PAID') {
    return '';
  }

  return `<button class="btn btn-outline" type="button" data-cod-order="${escapeHtml(order.code)}">Thanh toán khi nhận hàng</button>`;
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

function bindCashOnDeliveryButton() {
  const button = document.querySelector('[data-cod-order]');

  button?.addEventListener('click', async () => {
    const code = button.dataset.codOrder;
    const previousText = button.textContent;

    button.disabled = true;
    button.textContent = 'Đang cập nhật...';

    try {
      const response = await apiFetch(`/orders/${encodeURIComponent(code)}/cash-on-delivery`, {
        method: 'POST',
      });

      sessionStorage.removeItem(SELECTED_CART_STORAGE_KEY);
      renderCashOnDeliverySuccess(response.data);
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

function renderPaidSuccess(order) {
  if (!root) return;
  clearPaymentPoll();
  sessionStorage.removeItem(SELECTED_CART_STORAGE_KEY);
  setFormLayout(false);

  root.innerHTML = `
    <section class="locked-state container reveal">
      <div>
        <p class="section-kicker">THANH TOÁN THÀNH CÔNG</p>
        <h1>Đơn hàng đã thanh toán</h1>
        <p>Đơn ${escapeHtml(order.code)} đã được xác nhận. ROOMI sẽ xử lý đơn hàng và liên hệ giao hàng.</p>
        <div class="payment-actions payment-actions--center">
          <a class="btn btn-maroon" href="${pageHref('products.html')}">Tiếp tục mua sắm</a>
          <a class="btn btn-outline" href="${homeHref}">Về trang chủ</a>
        </div>
      </div>
    </section>
  `;

  observeReveal();
}

function pollPaymentOrder(code, startedAt = Date.now()) {
  clearPaymentPoll();

  if (!code || Date.now() - startedAt >= PAYMENT_POLL_LIMIT_MS) {
    const note = root?.querySelector('[data-payment-poll-note]');
    if (note) {
      note.textContent = 'Đã dừng tự động kiểm tra sau 2 phút. Bạn có thể tải lại trang nếu đã thanh toán.';
    }
    return;
  }

  paymentPollTimer = window.setTimeout(async () => {
    try {
      const response = await apiFetch(`/orders/${encodeURIComponent(code)}`);
      const order = response.data;

      if (order.paymentStatus === 'PAID') {
        renderPaidSuccess(order);
        return;
      }

      pollPaymentOrder(code, startedAt);
    } catch (_error) {
      pollPaymentOrder(code, startedAt);
    }
  }, Math.min(2500, PAYMENT_POLL_LIMIT_MS - (Date.now() - startedAt)));
}

function renderAutoPaymentPending(order) {
  if (!root) return;
  setFormLayout(false);

  if (order.paymentStatus === 'PAID') {
    renderPaidSuccess(order);
    return;
  }

  root.innerHTML = `
    <section class="locked-state container reveal">
      <div>
        <p class="section-kicker">CHUYỂN KHOẢN</p>
        <h1>Đang chờ xác nhận</h1>
        <p>Đơn ${escapeHtml(order.code)} đang chờ xác nhận thanh toán. Trang sẽ tự cập nhật khi hoàn tất.</p>
        <p class="checkout-notice" data-payment-poll-note>Trang sẽ tự cập nhật khi thanh toán được xác nhận.</p>
        <div class="payment-actions payment-actions--center">
          <a class="btn btn-outline" href="${pageHref('products.html')}">Tiếp tục mua sắm</a>
        </div>
      </div>
    </section>
  `;

  observeReveal();
  pollPaymentOrder(order.code);
}

function renderOrderPayment(order, { successView = false } = {}) {
  if (!root) return;

  if (isCashOnDelivery(order)) {
    renderCashOnDeliverySuccess(order);
    return;
  }

  if (isPayos(order)) {
    renderAutoPaymentPending(order);
    return;
  }

  if (isSepay(order) && order.paymentStatus === 'PAID') {
    renderPaidSuccess(order);
    return;
  }

  clearPaymentPoll();
  setPaymentLayout(true);

  const payment = order.payment || {};
  const qrMarkup = payment.qrUrl
    ? `<img class="vietqr-image" src="${escapeHtml(payment.qrUrl)}" alt="QR chuyển khoản cho đơn hàng ${escapeHtml(order.code)}">`
    : `
      <div class="vietqr-missing">
        <strong>Chưa cấu hình tài khoản nhận tiền</strong>
        <p>Điền VIETQR_ACCOUNT_NO, VIETQR_ACCOUNT_NAME và SEPAY_QR_BANK_NAME (nếu dùng SePay) hoặc VIETQR_BANK_ID (nếu dùng VietQR) trong backend/.env rồi restart server.</p>
      </div>
    `;

  root.innerHTML = `
    <section class="container checkout-title-row checkout-payment-title reveal">
      <h1>${successView ? 'Đơn hàng đã tạo' : 'Quét mã thanh toán'}</h1>
      <span></span>
    </section>

    <section class="vietqr-section container reveal">
      <div class="vietqr-card">
        <p class="section-kicker">CHUYỂN KHOẢN</p>
        ${qrMarkup}
        <p class="vietqr-help">QR đã có sẵn số tiền và nội dung chuyển khoản riêng cho đơn này.</p>
      </div>

      <div class="payment-info-card">
        <h2>${successView ? 'Đang chờ đối soát' : 'Thông tin chuyển khoản'}</h2>
        <p>Sau khi chuyển khoản, ROOMI sẽ kiểm tra và xác nhận thanh toán.</p>
        <div class="payment-info-list">
          ${renderPaymentRows(order)}
        </div>
        <p class="checkout-notice" data-payment-poll-note>Trang sẽ tự cập nhật khi thanh toán được xác nhận.</p>
        <div class="payment-actions">
          ${renderReportPaidAction(order)}
          ${renderCashOnDeliveryAction(order)}
          <a class="btn btn-outline" href="${pageHref('products.html')}">Tiếp tục mua sắm</a>
        </div>
      </div>
    </section>
  `;

  bindCopyButtons();
  bindReportPaidButton();
  bindCashOnDeliveryButton();
  observeReveal();
  pollPaymentOrder(order.code);
}

function renderCashOnDeliverySuccess(order) {
  if (!root) return;
  clearPaymentPoll();
  setFormLayout(false);

  root.innerHTML = `
    <section class="locked-state container reveal">
      <div>
        <p class="section-kicker">ĐẶT HÀNG THÀNH CÔNG</p>
        <h1>Thanh toán khi nhận hàng</h1>
        <p>Đơn ${escapeHtml(order.code)} đã được ghi nhận. ROOMI sẽ liên hệ xác nhận và bạn thanh toán ${formatCurrency(order.total)} khi nhận hàng.</p>
        <div class="payment-actions payment-actions--center">
          <a class="btn btn-maroon" href="${pageHref('products.html')}">Tiếp tục mua sắm</a>
          <a class="btn btn-outline" href="${homeHref}">Về trang chủ</a>
        </div>
      </div>
    </section>
  `;

  observeReveal();
}

function getFormPayload(form, paymentMethod = 'BANK_TRANSFER') {
  const formData = new FormData(form);

  return {
    name: formData.get('name')?.toString() || '',
    phone: formData.get('phone')?.toString() || '',
    email: formData.get('email')?.toString() || '',
    address: formData.get('address')?.toString() || '',
    note: formData.get('note')?.toString() || '',
    paymentMethod,
    cartItemIds: readSelectedCartItemIds() || undefined,
  };
}

function bindCheckoutForm() {
  const form = root?.querySelector('[data-checkout-form]');
  const submitButtons = Array.from(form?.querySelectorAll('[data-payment-method]') || []);
  const notice = form?.querySelector('[data-checkout-notice]');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (notice) {
      notice.textContent = '';
    }

    const submitButton = event.submitter?.closest('[data-payment-method]') || submitButtons[0];
    const paymentMethod = submitButton?.dataset.paymentMethod || 'BANK_TRANSFER';
    const previousText = submitButton?.textContent;

    submitButtons.forEach((button) => {
      button.disabled = true;
    });

    if (submitButton) {
      submitButton.textContent = paymentMethod === 'COD' ? 'Đang đặt hàng...' : 'Đang tạo đơn...';
    }

    try {
      const response = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(getFormPayload(form, paymentMethod)),
      });

      const order = response.data;

      // PayOS — redirect thẳng, không cần bước trung gian
      if (order.payment?.provider === 'PAYOS') {
        const checkoutUrl = order.payment.checkoutUrl;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
          return;
        }
        renderAutoPaymentPending(order);
      } else if (order.paymentMethod === 'COD' || order.payment?.provider === 'COD') {
        sessionStorage.removeItem(SELECTED_CART_STORAGE_KEY);
        renderCashOnDeliverySuccess(order);
      } else {
        renderOrderPayment(order);
      }
    } catch (error) {
      // Show field-level validation errors
      const fieldErrors = Array.isArray(error.data) ? error.data : [];
      if (fieldErrors.length > 0) {
        // Clear all previous field errors
        form.querySelectorAll('[data-field-error]').forEach(el => el.remove());
        form.querySelectorAll('.roomi-input--error').forEach(el => el.classList.remove('roomi-input--error'));

        for (const err of fieldErrors) {
          const fieldName = err.field.replace(/^body\./, '');
          const input = form.querySelector(`[name="${fieldName}"]`);
          if (input) {
            input.classList.add('roomi-input--error');
            const msg = document.createElement('span');
            msg.className = 'checkout-field-error';
            msg.setAttribute('data-field-error', '');
            msg.textContent = translateValidationError(err);
            input.parentNode?.appendChild(msg);
          }
        }
      }

      if (notice) {
        notice.textContent = fieldErrors.length > 0 ? 'Vui lòng kiểm tra lại thông tin bên dưới.' : (error.message || 'Không tạo được đơn hàng.');
      }

      submitButtons.forEach((button) => {
        button.disabled = false;
      });

      if (submitButton && previousText) {
        submitButton.textContent = previousText;
      }
    }
  });
}

function translateValidationError(err) {
  const msg = err.message || '';
  // Generic pattern matching for Zod error messages
  if (msg.includes('Too small') || msg.includes('at least')) {
    const num = (msg.match(/(\d+)/) || [])[1] || '';
    const labels = {
      'body.name': `Tên phải có ít nhất ${num} ký tự`,
      'body.phone': `SĐT phải có ít nhất ${num} ký tự`,
      'body.address': `Địa chỉ phải có ít nhất ${num} ký tự`,
      'body.email': `Email phải có ít nhất ${num} ký tự`,
      'body.note': `Ghi chú phải có ít nhất ${num} ký tự`,
    };
    if (labels[err.field]) return labels[err.field];
    return `Phải có ít nhất ${num} ký tự`;
  }
  if (msg.includes('Too big') || msg.includes('at most')) {
    const num = (msg.match(/(\d+)/) || [])[1] || '';
    const labels = {
      'body.name': `Tên tối đa ${num} ký tự`,
      'body.phone': `SĐT tối đa ${num} ký tự`,
      'body.address': `Địa chỉ tối đa ${num} ký tự`,
      'body.email': `Email tối đa ${num} ký tự`,
      'body.note': `Ghi chú tối đa ${num} ký tự`,
    };
    if (labels[err.field]) return labels[err.field];
    return `Tối đa ${num} ký tự`;
  }
  if (msg.includes('Invalid') && msg.includes('email')) return 'Email không đúng định dạng';
  if (msg.includes('Invalid') && msg.includes('enum')) return 'Giá trị không hợp lệ';

  const map = {
    'body.name': 'Tên không hợp lệ',
    'body.phone': 'SĐT không hợp lệ',
    'body.email': 'Email không hợp lệ',
    'body.address': 'Địa chỉ không hợp lệ',
    'body.note': 'Ghi chú không hợp lệ',
    'body.paymentMethod': 'Phương thức thanh toán không hợp lệ',
  };
  return map[err.field] || msg;
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
          <a class="btn btn-maroon" href="${pageHref('cart.html')}">Quay lại giỏ hàng</a>
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
            <div class="payment-method-actions">
              <button class="btn btn-maroon payment-submit" type="submit" data-payment-method="BANK_TRANSFER">Chuyển khoản</button>
              <button class="btn btn-outline payment-submit" type="submit" data-payment-method="COD">Thanh toán khi nhận hàng</button>
            </div>
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
        <p>Chuyển khoản qua QR để được xác nhận tự động, hoặc chọn thanh toán khi nhận hàng.</p>
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
  const query = new URLSearchParams(window.location.search);
  const ref = query.get('ref');             // Our order code (RM...)
  const payosOrderCode = query.get('orderCode'); // PayOS's internal code

  if (!ref && !payosOrderCode) {
    if (!root) return;
    root.innerHTML = `
      <section class="locked-state container reveal">
        <div>
          <p class="section-kicker">ORDER CREATED</p>
          <h1>Đơn hàng đã được tạo</h1>
          <p>ROOMI sẽ kiểm tra thanh toán và liên hệ xác nhận đơn hàng.</p>
          <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-top:32px">
            <a class="btn btn-maroon" href="${pageHref('products.html')}">Tiếp tục mua sắm</a>
            <a class="btn btn-outline" href="${homeHref}">Về trang chủ</a>
          </div>
        </div>
      </section>
    `;
    observeReveal();
    return;
  }

  renderLoading('Đang tải thông tin đơn hàng...');

  // ref = our RM order code; orderCode = PayOS's internal code
  const endpoint = ref
    ? `/orders/public/${encodeURIComponent(ref)}`
    : `/orders/public/provider/${encodeURIComponent(payosOrderCode)}`;

  try {
    const response = await apiFetch(endpoint);
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
