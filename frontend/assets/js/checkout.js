import { cartItems, formatCurrency } from './data.js';
import { miniArt, observeReveal, renderShell, requireAuth } from './common.js?v=nav-public-1';

renderShell('cart');

const root = document.querySelector('#checkoutRoot');
const mode = document.body.dataset.checkout || 'form';
const canCheckout = requireAuth();
const items = cartItems.slice(0, 3).map((product, index) => ({
  product,
  quantity: index === 0 ? 2 : 1,
}));
const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
const shipping = 30000;
const total = subtotal + shipping;

if (root && canCheckout && mode === 'success') {
  root.innerHTML = `
    <section class="locked-state container reveal">
      <div>
        <p class="section-kicker">ORDER SUCCESS</p>
        <h1>Thanh toán thành công</h1>
        <p>ROOMI đã nhận đơn mô phỏng của bạn. Khi nối backend, mã đơn và trạng thái giao hàng sẽ hiển thị tại đây.</p>
        <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;margin-top:32px">
          <a class="btn btn-maroon" href="products.html">Tiếp tục mua sắm</a>
          <a class="btn btn-outline" href="index.html">Về trang chủ</a>
        </div>
      </div>
    </section>
  `;
}

if (root && canCheckout && mode !== 'success') {
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
            ${items
              .map(
                (item) => `
                  <div class="checkout-row">
                    <div class="cart-product">
                      ${miniArt(item.product.name)}
                      <strong>${item.product.name}</strong>
                    </div>
                    <span>${formatCurrency(item.product.price)}</span>
                    <span>x${item.quantity}</span>
                    <strong>${formatCurrency(item.product.price * item.quantity)}</strong>
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
        <p>Ảnh sản phẩm đang để trống theo đúng asset hiện có.</p>
      </div>
    </section>
    <section class="checkout-total">
      <div class="container">
        Tổng thanh toán <strong>${formatCurrency(total)}</strong>
      </div>
    </section>
  `;
}

if (canCheckout) {
  observeReveal();
}
