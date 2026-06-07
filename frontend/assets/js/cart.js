import { cartItems, formatCurrency } from './data.js';
import { miniArt, observeReveal, renderShell } from './common.js?v=nav-public-1';

renderShell('cart');

const root = document.querySelector('#cartRoot');
let items = cartItems.map((product, index) => ({
  id: `${product.id}-${index}`,
  product,
  quantity: index === 0 ? 2 : 1,
}));

function totalOf(item) {
  return item.product.price * item.quantity;
}

function renderCart() {
  if (!root) return;

  const subtotal = items.reduce((sum, item) => sum + totalOf(item), 0);

  root.innerHTML = `
    <section class="cart-section container reveal">
      <div class="section-title">
        <h1>Giỏ hàng</h1>
      </div>
      <div class="cart-table" style="margin-top:58px">
        <div class="cart-head">
          <span>Sản phẩm</span>
          <span>Giá</span>
          <span>Số lượng</span>
          <span>Tạm tính</span>
        </div>
        ${items
          .map(
            (item) => `
              <article class="cart-row">
                <div class="cart-product">
                  <button class="remove-button" type="button" data-remove="${item.id}" aria-label="Xóa sản phẩm">&times;</button>
                  ${miniArt(item.product.name)}
                  <strong>${item.product.name}</strong>
                </div>
                <span>${formatCurrency(item.product.price)}</span>
                <div class="qty">
                  <button type="button" data-decrease="${item.id}" aria-label="Giảm số lượng">-</button>
                  <strong>${item.quantity}</strong>
                  <button type="button" data-increase="${item.id}" aria-label="Tăng số lượng">+</button>
                </div>
                <strong>${formatCurrency(totalOf(item))}</strong>
              </article>
            `,
          )
          .join('')}
        <div class="cart-summary">
          <span>Tổng cộng</span>
          <strong>${formatCurrency(subtotal)}</strong>
          <a class="btn btn-cream" href="checkout.html">Thanh toán</a>
        </div>
      </div>
    </section>
  `;
}

root?.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-remove]');
  const increase = event.target.closest('[data-increase]');
  const decrease = event.target.closest('[data-decrease]');

  if (remove) {
    items = items.filter((item) => item.id !== remove.dataset.remove);
  }

  if (increase) {
    items = items.map((item) =>
      item.id === increase.dataset.increase ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }

  if (decrease) {
    items = items
      .map((item) =>
        item.id === decrease.dataset.decrease ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item,
      )
      .filter((item) => item.quantity > 0);
  }

  renderCart();
  observeReveal();
  renderCart();
  observeReveal();
});

renderCart();
observeReveal();
