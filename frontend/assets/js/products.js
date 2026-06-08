import { apiFetch, escapeHtml, observeReveal, productCard, renderShell } from './common.js?v=chat-icon-1';

renderShell('products');

const pillRoot = document.querySelector('#categoryPills');
const grid = document.querySelector('#productsGrid');
let categories = [{ id: 'all', label: 'Tất cả sản phẩm' }];
let activeCategory = 'all';

function renderPills() {
  if (!pillRoot) return;

  pillRoot.innerHTML = categories
    .map(
      (category) => `
        <button class="${category.id === activeCategory ? 'is-active' : ''}" type="button" data-category="${escapeHtml(category.id)}">
          ${escapeHtml(category.label)}
        </button>
      `,
    )
    .join('');
}

function renderLoading() {
  if (!grid) return;
  grid.innerHTML = '<p class="empty-copy">Đang tải sản phẩm...</p>';
}

function renderError(error) {
  if (!grid) return;
  grid.innerHTML = `<p class="empty-copy">${escapeHtml(error.message || 'Không tải được sản phẩm.')}</p>`;
}

function renderProducts(products) {
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '<p class="empty-copy">Chưa có sản phẩm trong danh mục này.</p>';
    return;
  }

  grid.innerHTML = products.map(productCard).join('');
  observeReveal();
}

async function loadProducts() {
  renderLoading();

  const query = new URLSearchParams({
    limit: '100',
  });

  if (activeCategory !== 'all') {
    query.set('category', activeCategory);
  }

  const response = await apiFetch(`/products?${query.toString()}`);
  renderProducts(response.data.items);
}

async function init() {
  try {
    const [categoryResponse] = await Promise.all([
      apiFetch('/categories'),
    ]);

    categories = [
      { id: 'all', label: 'Tất cả sản phẩm' },
      ...categoryResponse.data.map((category) => ({
        id: category.slug,
        label: category.label,
      })),
    ];

    renderPills();
    await loadProducts();
  } catch (error) {
    renderError(error);
  }
}

pillRoot?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-category]');
  if (!button || button.dataset.category === activeCategory) return;

  activeCategory = button.dataset.category;
  renderPills();

  try {
    await loadProducts();
  } catch (error) {
    renderError(error);
  }
});

init();

