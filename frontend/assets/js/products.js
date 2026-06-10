import { apiFetch, escapeHtml, observeReveal, productCard, renderShell } from './common.js?v=pages-path-1';

renderShell('products');

const pillRoot = document.querySelector('#categoryPills');
const grid = document.querySelector('#productsGrid');
const pagerRoot = document.querySelector('#productsPager');
const PRODUCTS_PER_PAGE = 9;

let categories = [{ id: 'all', label: 'Tất cả sản phẩm' }];
const urlParams = new URLSearchParams(window.location.search);
let activeCategory = urlParams.get('category') || 'all';
let activeSearch = urlParams.get('search') || '';
let currentPage = Number(urlParams.get('page') || 1);
let pagination = {
  page: 1,
  limit: PRODUCTS_PER_PAGE,
  total: 0,
  totalPages: 1,
};

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
  if (pagerRoot) pagerRoot.innerHTML = '';
}

function renderError(error) {
  if (!grid) return;
  grid.innerHTML = `<p class="empty-copy">${escapeHtml(error.message || 'Không tải được sản phẩm.')}</p>`;
  if (pagerRoot) pagerRoot.innerHTML = '';
}

function renderProducts(products) {
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = '<p class="empty-copy">Chưa có sản phẩm trong danh mục này.</p>';
    renderPager();
    return;
  }

  grid.innerHTML = products.map(productCard).join('');
  renderPager();
  observeReveal();
}

function paginationRange(page, totalPages) {
  const delta = 1;
  const range = [];
  const result = [];
  let lastValue = 0;

  for (let value = 1; value <= totalPages; value += 1) {
    if (value === 1 || value === totalPages || (value >= page - delta && value <= page + delta)) {
      range.push(value);
    }
  }

  range.forEach((value) => {
    if (lastValue && value - lastValue > 1) {
      result.push('gap');
    }

    result.push(value);
    lastValue = value;
  });

  return result;
}

function renderPager() {
  if (!pagerRoot) return;

  const totalPages = Number(pagination.totalPages) || 1;
  const page = Number(pagination.page) || 1;

  if (totalPages <= 1) {
    pagerRoot.innerHTML = '';
    return;
  }

  const pageButtons = paginationRange(page, totalPages)
    .map((item) => {
      if (item === 'gap') {
        return '<span class="pager-gap" aria-hidden="true">...</span>';
      }

      return `
        <button class="${item === page ? 'active' : ''}" type="button" data-page="${item}" aria-label="Trang ${item}" ${item === page ? 'aria-current="page"' : ''}>
          ${item}
        </button>
      `;
    })
    .join('');

  pagerRoot.innerHTML = `
    <button type="button" data-page="${Math.max(1, page - 1)}" ${page <= 1 ? 'disabled' : ''} aria-label="Trang trước">
      <i class="ph ph-caret-left" aria-hidden="true"></i>
    </button>
    ${pageButtons}
    <button type="button" data-page="${Math.min(totalPages, page + 1)}" ${page >= totalPages ? 'disabled' : ''} aria-label="Trang sau">
      <i class="ph ph-caret-right" aria-hidden="true"></i>
    </button>
  `;
}

async function loadProducts() {
  renderLoading();

  const query = new URLSearchParams({
    page: String(currentPage),
    limit: String(PRODUCTS_PER_PAGE),
  });

  if (activeCategory !== 'all') {
    query.set('category', activeCategory);
  }
  if (activeSearch) {
    query.set('search', activeSearch);
  }

  const response = await apiFetch(`/products?${query.toString()}`);
  pagination = response.data.pagination || {
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    total: response.data.items.length,
    totalPages: 1,
  };
  currentPage = pagination.page || currentPage;
  renderProducts(response.data.items);
}

async function init() {
  // Populate search bar with current query
  if (activeSearch) {
    const searchInput = document.querySelector('[data-search-form] input');
    if (searchInput) searchInput.value = activeSearch;
  }

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
  currentPage = 1;
  renderPills();

  try {
    await loadProducts();
  } catch (error) {
    renderError(error);
  }
});

pagerRoot?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-page]');
  if (!button || button.disabled) return;

  const nextPage = Number(button.dataset.page);
  if (!Number.isInteger(nextPage) || nextPage === currentPage) return;

  currentPage = nextPage;

  try {
    await loadProducts();
    grid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    renderError(error);
  }
});

init();
