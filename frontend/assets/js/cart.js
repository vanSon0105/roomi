import { formatCurrency } from './data.js';
import { apiFetch, escapeHtml, miniArt, observeReveal, renderShell } from './common.js?v=chat-icon-1';

renderShell('cart');

const root = document.querySelector('#cartRoot');
let cart = null;

function renderLoading() {
  if (!root) return;
  root.innerHTML = '<section class="cart-section container"><p class="empty-copy">Đang tải giỏ hàng...</p></section>';
}

function renderEmpty() {
  if (!root) return;
  root.innerHTML = `
    <section class="locked-state container reveal">
      <div>
        <h1>Giỏ hàng đang trống</h1>
        <p>Chọn sản phẩm yêu thích rồi thêm vào giỏ để bắt đầu đặt hàng.</p>
        <a class="btn btn-maroon" href="products.html">Xem sản phẩm</a>
      </div>
    </section>
  `;
}

function renderError(error) {
  if (!root) return;
  root.innerHTML = `
    <section class="locked-state container">
      <div>
        <h1>Không tải được giỏ hàng</h1>
        <p>${escapeHtml(error.message || 'Vui lòng thử lại.')}</p>
      </div>
    </section>
  `;
}

function renderCart() {
  if (!root || !cart) return;

  if (cart.items.length === 0) {
    renderEmpty();
    observeReveal();
    return;
  }

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
          <span>Thành tiền</span>
        </div>
        ${cart.items
          .map(
            (item) => `
              <article class="cart-row">
                <div class="cart-product">
                  <button class="remove-button" type="button" data-remove="${item.id}" aria-label="Xóa sản phẩm">&times;</button>
                  ${miniArt(item.product.name, item.product.imageUrl)}
                  <strong>${escapeHtml(item.product.name)}</strong>
                </div>
                <span>${formatCurrency(item.product.price)}</span>
                <div class="qty">
                  <button type="button" data-decrease="${item.id}" aria-label="Giảm số lượng">-</button>
                  <strong>${item.quantity}</strong>
                  <button type="button" data-increase="${item.id}" aria-label="Tăng số lượng">+</button>
                </div>
                <strong>${formatCurrency(item.total)}</strong>
              </article>
            `,
          )
          .join('')}
        <div class="cart-summary">
          <span>Tổng cộng</span>
          <strong>${formatCurrency(cart.subtotal)}</strong>
          <a class="btn btn-cream" href="checkout.html">Thanh toán</a>
        </div>
      </div>
    </section>
  `;

  observeReveal();
}

async function loadCart() {
  renderLoading();

  try {
    const response = await apiFetch('/cart');
    cart = response.data;
    renderCart();
  } catch (error) {
    renderError(error);
  }
}

async function updateCartFromResponse(promise) {
  const response = await promise;
  cart = response.data;
  renderCart();
}

root?.addEventListener('click', async (event) => {
  const remove = event.target.closest('[data-remove]');
  const increase = event.target.closest('[data-increase]');
  const decrease = event.target.closest('[data-decrease]');
  const target = remove || increase || decrease;

  if (!target || !cart) return;

  target.disabled = true;

  try {
    if (remove) {
      await updateCartFromResponse(apiFetch(`/cart/items/${remove.dataset.remove}`, { method: 'DELETE' }));
      return;
    }

    const itemId = Number(target.dataset.increase || target.dataset.decrease);
    const item = cart.items.find((cartItem) => cartItem.id === itemId);
    if (!item) return;

    const quantity = increase ? item.quantity + 1 : item.quantity - 1;
    await updateCartFromResponse(
      apiFetch(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      }),
    );
  } catch (error) {
    renderError(error);
  }
});

loadCart();

