import { formatCurrency } from './data.js';
import { apiFetch, escapeHtml, miniArt, observeReveal, renderShell } from './common.js?v=nav-public-1';

renderShell('cart');

const root = document.querySelector('#checkoutRoot');
const mode = document.body.dataset.checkout || 'form';
const shipping = 30000;

function renderSuccess() {
  if (!root) return;

  root.innerHTML = `
    <section class="locked-state container reveal">
      <div>
        <p class="section-kicker">ORDER SUCCESS</p>
        <h1>Thanh toán thành công</h1>
        <p>ROOMI đã nhận đơn của bạn. Khi nối API đơn hàng, mã đơn và trạng thái giao hàng sẽ hiển thị tại đây.</p>
        <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-top:32px">
          <a class="btn btn-maroon" href="products.html">Tiếp tục mua sắm</a>
          <a class="btn btn-outline" href="index.html">Về trang chủ</a>
        </div>
      </div>
    </section>
  `;
  observeReveal();
}

function renderLoading() {
  if (!root) return;
  root.innerHTML = '<section class="container checkout-title-row"><p class="empty-copy">Đang tải giỏ hàng...</p></section>';
}

function renderEmpty() {
  if (!root) return;
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
  root.innerHTML = `
    <section class="locked-state container">
      <div>
        <h1>Không tải được thanh toán</h1>
        <p>${escapeHtml(error.message || 'Vui lòng thử lại.')}</p>
      </div>
    </section>
  `;
}

function renderCheckout(cart) {
  if (!root) return;

  if (cart.items.length === 0) {
    renderEmpty();
    return;
  }

  const total = cart.subtotal + shipping;

  root.innerHTML = `
    <section class="container checkout-title-row reveal">
      <h1>Thanh toán</h1>
      <span></span>
    </section>

    <section class="checkout-band reveal">
      <div class="checkout-inner container">
        <h2>Thông tin giao hàng</h2>
        <form action="checkout-success.html">
          <input class="roomi-input" name="name" autocomplete="name" placeholder="Họ và tên" required>
          <input class="roomi-input" name="phone" autocomplete="tel" placeholder="Số điện thoại" required>
          <input class="roomi-input" name="email" autocomplete="email" placeholder="Email" required>
          <input class="roomi-input" name="address" autocomplete="street-address" placeholder="Địa chỉ nhận hàng" required>

          <div class="checkout-product">
            ${cart.items
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

          <div class="payment-row">
            <span>Thanh toán</span>
            <button type="button">COD</button>
            <button type="button">Chuyển khoản</button>
            <button class="btn btn-maroon" type="submit">Xác nhận đặt hàng</button>
          </div>
        </form>
      </div>
    </section>

    <section class="checkout-meta">
      <div>
        <strong>Phí vận chuyển</strong>
        <p>${formatCurrency(shipping)}</p>
      </div>
      <div>
        <strong>Ghi chú</strong>
        <p>Thông tin sản phẩm được lấy trực tiếp từ cơ sở dữ liệu ROOMI.</p>
      </div>
    </section>
    <section class="checkout-total">
      <div class="container">
        Tổng thanh toán <strong>${formatCurrency(total)}</strong>
      </div>
    </section>
  `;

  observeReveal();
}

async function init() {
  if (mode === 'success') {
    renderSuccess();
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
