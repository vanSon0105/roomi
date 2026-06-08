import { formatCurrency } from './data.js';
import { apiFetch, escapeHtml, miniArt, observeReveal, renderShell } from './common.js?v=chat-icon-1';

renderShell('cart');

const root = document.querySelector('#cartRoot');
const SELECTED_CART_STORAGE_KEY = 'roomi_selected_cart_items';
let cart = null;
let selectedCartItemIds = new Set();

function readSelectedCartItems() {
  try {
    const ids = JSON.parse(sessionStorage.getItem(SELECTED_CART_STORAGE_KEY) || '[]');
    return new Set((Array.isArray(ids) ? ids : []).map(Number).filter(Number.isFinite));
  } catch (_error) {
    return new Set();
  }
}

function writeSelectedCartItems() {
  sessionStorage.setItem(SELECTED_CART_STORAGE_KEY, JSON.stringify([...selectedCartItemIds]));
}

function syncSelectedCartItems() {
  if (!cart) return;

  const availableIds = new Set(cart.items.map((item) => item.id));
  selectedCartItemIds = new Set([...selectedCartItemIds].filter((id) => availableIds.has(id)));
  writeSelectedCartItems();
}

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

  const selectedItems = cart.items.filter((item) => selectedCartItemIds.has(item.id));
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
  const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const canCheckout = selectedItems.length > 0;

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
                  <div class="cart-row-controls">
                    <button
                      class="select-button ${selectedCartItemIds.has(item.id) ? 'is-selected' : ''}"
                      type="button"
                      data-select="${item.id}"
                      aria-label="${selectedCartItemIds.has(item.id) ? 'Bỏ chọn sản phẩm' : 'Chọn sản phẩm để thanh toán'}"
                      aria-pressed="${selectedCartItemIds.has(item.id) ? 'true' : 'false'}"
                    ></button>
                    <button class="remove-button" type="button" data-remove="${item.id}" aria-label="Xóa sản phẩm">&times;</button>
                  </div>
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
          <span>${canCheckout ? `Đã chọn ${selectedCount} sản phẩm` : 'Chọn sản phẩm để thanh toán'}</span>
          <strong>${formatCurrency(selectedSubtotal)}</strong>
          <a class="btn btn-cream ${canCheckout ? '' : 'is-disabled'}" href="${canCheckout ? 'checkout.html' : '#'}" data-checkout-link aria-disabled="${canCheckout ? 'false' : 'true'}">Thanh toán</a>
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
    selectedCartItemIds = readSelectedCartItems();
    syncSelectedCartItems();
    renderCart();
  } catch (error) {
    renderError(error);
  }
}

async function updateCartFromResponse(promise) {
  const response = await promise;
  cart = response.data;
  syncSelectedCartItems();
  renderCart();
}

root?.addEventListener('click', async (event) => {
  const remove = event.target.closest('[data-remove]');
  const select = event.target.closest('[data-select]');
  const increase = event.target.closest('[data-increase]');
  const decrease = event.target.closest('[data-decrease]');
  const checkoutLink = event.target.closest('[data-checkout-link]');
  const target = remove || select || increase || decrease || checkoutLink;

  if (!target || !cart) return;

  if (checkoutLink) {
    if (selectedCartItemIds.size === 0) {
      event.preventDefault();
      return;
    }

    writeSelectedCartItems();
    return;
  }

  if (select) {
    const itemId = Number(select.dataset.select);

    if (selectedCartItemIds.has(itemId)) {
      selectedCartItemIds.delete(itemId);
    } else {
      selectedCartItemIds.add(itemId);
    }

    writeSelectedCartItems();
    renderCart();
    return;
  }

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
