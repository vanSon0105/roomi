import { formatCurrency } from './data.js';
import {
  apiFetch,
  escapeHtml,
  observeReveal,
  productArt,
  productCard,
  protectedHref,
  redirectToLogin,
  renderShell,
  stars,
} from './common.js?v=nav-public-1';

renderShell('products');

const root = document.querySelector('#productDetailRoot');
const params = new URLSearchParams(window.location.search);
const productSlug = params.get('id');
let currentProduct = null;

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
          <a class="btn btn-outline" href="${protectedHref('checkout.html')}">Mua ngay</a>
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
  `;
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
  const button = event.target.closest('[data-add-to-cart]');
  if (!button) return;

  addToCart(button);
});

init();
