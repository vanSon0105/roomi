import { formatCurrency } from './data.js';
import {
  apiFetch,
  escapeHtml,
  miniArt,
  observeReveal,
  productArt,
  productCard,
  redirectToLogin,
  renderShell,
  stars,
} from './common.js?v=chat-icon-1';

renderShell('products');

const root = document.querySelector('#productDetailRoot');
const params = new URLSearchParams(window.location.search);
const productSlug = params.get('id');
const SELECTED_CART_STORAGE_KEY = 'roomi_selected_cart_items';
let currentProduct = null;
let buyNowQuantity = 1;

function renderLoading() {
  if (!root) return;
  root.innerHTML = '<section class="locked-state container"><p>Đang tải sản phẩm...</p></section>';
}

function renderError(error) {
  if (!root) return;
  root.innerHTML = `
    <section class="locked-state container">
      <div>
        <h1>Không tải được sản phẩm</h1>
        <p>${escapeHtml(error.message || 'Sản phẩm không tồn tại.')}</p>
        <a class="btn btn-maroon" href="products.html">Quay lại sản phẩm</a>
      </div>
    </section>
  `;
}

function renderProduct(product, related) {
  if (!root) return;

  const bullets = product.bullets?.length
    ? product.bullets
    : product.suitableFor
      ? product.suitableFor.split(';').map((item) => item.trim()).filter(Boolean)
      : [];

  root.innerHTML = `
    <section class="container detail-grid">
      <div class="detail-media reveal">
        ${productArt(product.name, product.imageUrl)}
      </div>
      <article class="detail-copy reveal" style="--index:1">
        <a class="btn btn-outline" href="products.html">Quay lại sản phẩm</a>
        <h1>${escapeHtml(product.name)}</h1>
        <div class="detail-rating">
          <span class="stars">${stars(product.rating)}</span>
          <span>${escapeHtml(product.categoryLabel || '')}</span>
        </div>
        <div class="detail-price">${formatCurrency(product.price)}</div>
        <div class="detail-actions">
          <button class="btn btn-maroon" type="button" data-add-to-cart>Thêm vào giỏ</button>
          <button class="btn btn-outline" type="button" data-buy-now>Mua ngay</button>
        </div>
      </article>
    </section>

    <section class="description container reveal">
      <h2>Mô tả sản phẩm</h2>
      <p>${escapeHtml(product.description || product.shortDescription || '')}</p>
      ${
        bullets.length
          ? `<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
          : ''
      }
    </section>

    <section class="section container">
      <div class="section-title">
        <h2>Sản phẩm liên quan</h2>
      </div>
      <div class="product-grid" style="margin-top:70px">
        ${related.length ? related.map(productCard).join('') : '<p class="empty-copy">Chưa có sản phẩm liên quan.</p>'}
      </div>
    </section>

    <div class="buy-now-modal" data-buy-now-modal aria-hidden="true">
      <button class="buy-now-overlay" type="button" data-buy-now-close aria-label="Đóng chọn số lượng"></button>
      <section class="buy-now-sheet" role="dialog" aria-modal="true" aria-label="Chọn số lượng mua ngay">
        <button class="buy-now-close" type="button" data-buy-now-close aria-label="Đóng">&times;</button>
        <div class="buy-now-summary">
          ${miniArt(product.name, product.imageUrl)}
          <div>
            <h2>${escapeHtml(product.name)}</h2>
            <strong>${formatCurrency(product.price)}</strong>
            <p>${Number(product.stock) > 0 ? `Còn ${Number(product.stock)} sản phẩm` : 'Sản phẩm sẵn sàng đặt hàng'}</p>
          </div>
        </div>
        <div class="buy-now-control">
          <span>Số lượng</span>
          <div class="buy-now-stepper">
            <button type="button" data-buy-now-qty="decrease" aria-label="Giảm số lượng">-</button>
            <input type="text" value="1" inputmode="numeric" data-buy-now-input aria-label="Số lượng mua ngay">
            <button type="button" data-buy-now-qty="increase" aria-label="Tăng số lượng">+</button>
          </div>
        </div>
        <p class="buy-now-notice" data-buy-now-notice></p>
        <button class="btn btn-maroon buy-now-confirm" type="button" data-buy-now-confirm>Xác nhận</button>
      </section>
    </div>
  `;
}

function getBuyNowLimit() {
  const stock = Number(currentProduct?.stock);

  if (Number.isFinite(stock) && stock > 0) {
    return Math.min(99, stock);
  }

  return 99;
}

function setBuyNowQuantity(nextQuantity) {
  const input = root?.querySelector('[data-buy-now-input]');
  const limit = getBuyNowLimit();

  buyNowQuantity = Math.max(1, Math.min(limit, Number(nextQuantity) || 1));

  if (input) {
    input.value = String(buyNowQuantity);
  }
}

function openBuyNowModal() {
  const modal = root?.querySelector('[data-buy-now-modal]');
  const notice = root?.querySelector('[data-buy-now-notice]');

  setBuyNowQuantity(1);

  if (notice) {
    notice.textContent = '';
  }

  modal?.classList.add('is-open');
  modal?.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeBuyNowModal() {
  const modal = root?.querySelector('[data-buy-now-modal]');

  modal?.classList.remove('is-open');
  modal?.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

async function addToCart(button) {
  if (!currentProduct) return;

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Đang thêm...';

  try {
    await apiFetch('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        productSlug: currentProduct.slug,
        quantity: 1,
      }),
    });
    button.textContent = 'Đã thêm';
  } catch (error) {
    if (error.status === 401) {
      redirectToLogin();
      return;
    }

    button.textContent = error.message || 'Không thêm được';
  } finally {
    window.setTimeout(() => {
      button.disabled = false;
      button.textContent = originalText;
    }, 1300);
  }
}

async function confirmBuyNow(button) {
  if (!currentProduct) return;

  const notice = root?.querySelector('[data-buy-now-notice]');
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = 'Đang xử lý...';

  if (notice) {
    notice.textContent = '';
  }

  try {
    const response = await apiFetch('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        productSlug: currentProduct.slug,
        quantity: buyNowQuantity,
      }),
    });

    const selectedItem = response.data?.items?.find((item) => item.product?.slug === currentProduct.slug);

    if (selectedItem) {
      sessionStorage.setItem(SELECTED_CART_STORAGE_KEY, JSON.stringify([selectedItem.id]));
    }

    window.location.href = 'checkout.html';
  } catch (error) {
    if (error.status === 401) {
      redirectToLogin();
      return;
    }

    if (notice) {
      notice.textContent = error.message || 'Không thể mua ngay.';
    }

    button.disabled = false;
    button.textContent = originalText;
  }
}

async function init() {
  if (!productSlug) {
    renderError(new Error('Thiếu mã sản phẩm.'));
    return;
  }

  renderLoading();

  try {
    const [productResponse, relatedResponse] = await Promise.all([
      apiFetch(`/products/${encodeURIComponent(productSlug)}`),
      apiFetch(`/products/${encodeURIComponent(productSlug)}/related?limit=3`),
    ]);

    currentProduct = productResponse.data;
    renderProduct(currentProduct, relatedResponse.data);
    observeReveal();
  } catch (error) {
    renderError(error);
  }
}

root?.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-to-cart]');

  if (addButton) {
    addToCart(addButton);
    return;
  }

  const buyNowButton = event.target.closest('[data-buy-now]');

  if (buyNowButton) {
    openBuyNowModal();
    return;
  }

  const closeButton = event.target.closest('[data-buy-now-close]');

  if (closeButton) {
    closeBuyNowModal();
    return;
  }

  const quantityButton = event.target.closest('[data-buy-now-qty]');

  if (quantityButton) {
    const delta = quantityButton.dataset.buyNowQty === 'increase' ? 1 : -1;
    setBuyNowQuantity(buyNowQuantity + delta);
    return;
  }

  const confirmButton = event.target.closest('[data-buy-now-confirm]');

  if (confirmButton) {
    confirmBuyNow(confirmButton);
  }
});

root?.addEventListener('input', (event) => {
  const input = event.target.closest('[data-buy-now-input]');

  if (input) {
    setBuyNowQuantity(input.value);
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeBuyNowModal();
  }
});

init();
