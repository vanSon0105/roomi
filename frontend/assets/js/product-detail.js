import { categoryLabel, findProduct, formatCurrency, products } from './data.js';
import { observeReveal, productArt, productCard, protectedHref, renderShell, stars } from './common.js?v=nav-public-1';

renderShell('products');

const root = document.querySelector('#productDetailRoot');
const params = new URLSearchParams(window.location.search);
const product = findProduct(params.get('id'));

if (root) {
  const related = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .concat(products.filter((item) => item.id !== product.id))
    .slice(0, 3);

  root.innerHTML = `
    <section class="container detail-grid">
      <div class="detail-media reveal">
        ${productArt(product.name)}
      </div>
      <article class="detail-copy reveal" style="--index:1">
        <a class="btn btn-outline" href="products.html">Quay lại sản phẩm</a>
        <h1>${product.name}</h1>
        <div class="detail-rating">
          <span class="stars">${stars(product.rating)}</span>
          <span>${categoryLabel(product.category)}</span>
        </div>
        <div class="detail-price">${formatCurrency(product.price)}</div>
        <div class="detail-actions">
          <button class="btn btn-maroon" type="button">Thêm vào giỏ</button>
          <a class="btn btn-outline" href="${protectedHref('checkout.html')}">Mua ngay</a>
        </div>
      </article>
    </section>

    <section class="description container reveal">
      <h2>Mô tả sản phẩm</h2>
      <p>${product.description}</p>
      <ul>
        ${product.bullets.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </section>

    <section class="section container">
      <div class="section-title">
        <h2>Sản phẩm liên quan</h2>
      </div>
      <div class="product-grid" style="margin-top:70px">
        ${related.map(productCard).join('')}
      </div>
    </section>
  `;
}

observeReveal();
