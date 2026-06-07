import { categories, products } from './data.js';
import { observeReveal, productCard, renderShell } from './common.js?v=nav-public-1';

renderShell('products');

const pillRoot = document.querySelector('#categoryPills');
const grid = document.querySelector('#productsGrid');
let activeCategory = 'all';

function renderPills() {
  if (!pillRoot) return;

  pillRoot.innerHTML = categories
    .map(
      (category) => `
        <button class="${category.id === activeCategory ? 'is-active' : ''}" type="button" data-category="${category.id}">
          ${category.label}
        </button>
      `,
    )
    .join('');
}

function renderProducts() {
  if (!grid) return;

  const visible =
    activeCategory === 'all'
      ? products
      : products.filter((product) => product.category === activeCategory);

  grid.innerHTML = visible.map(productCard).join('');
  observeReveal();
}

pillRoot?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;

  activeCategory = button.dataset.category;
  renderPills();
  renderProducts();
});

renderPills();
renderProducts();
