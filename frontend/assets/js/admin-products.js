import {
  apiFetch,
  escapeHtml,
  formatCurrency,
  mediaUrl,
  productStatusOptions,
  renderAdminEmpty,
  renderAdminError,
  renderAdminShell,
  renderPagination,
  statusBadge,
} from './admin-common.js';

renderAdminShell('products');

const root = document.querySelector('#adminProducts');
const params = new URLSearchParams(window.location.search);
let state = {
  page: Number(params.get('page') || 1),
  search: params.get('search') || '',
  status: params.get('status') || 'ALL',
};

function buildQuery() {
  const query = new URLSearchParams({
    page: String(state.page),
    limit: '14',
    status: state.status || 'ALL',
  });
  if (state.search) query.set('search', state.search);
  return query;
}

function renderFilters() {
  return `
    <form class="admin-filters" data-product-filters>
      <label>
        <span>Tìm sản phẩm</span>
        <input name="search" type="search" value="${escapeHtml(state.search)}" placeholder="Tên, SKU, slug">
      </label>
      <label>
        <span>Trạng thái</span>
        <select name="status">${productStatusOptions(state.status, { includeAll: true })}</select>
      </label>
      <button class="admin-primary-link" type="submit">Lọc sản phẩm</button>
    </form>
  `;
}

function renderProductRows(products) {
  if (!products.length) {
    return renderAdminEmpty('Không tìm thấy sản phẩm phù hợp.');
  }

  return `
    <div class="admin-table admin-products-table">
      <div class="admin-table-head">
        <span>Sản phẩm</span>
        <span>Giá</span>
        <span>Kho</span>
        <span>Trạng thái</span>
        <span>Nổi bật</span>
      </div>
      ${products
        .map(
          (product) => `
            <article class="admin-table-row">
              <div class="admin-product-mini">
                <span class="admin-thumb">${product.imageUrl ? `<img src="${mediaUrl(product.imageUrl)}" alt="${escapeHtml(product.name)}">` : ''}</span>
                <div>
                  <strong>${escapeHtml(product.name)}</strong>
                  <small>${escapeHtml(product.sku || product.slug)} - ${escapeHtml(product.categoryLabel || 'Chưa phân loại')}</small>
                </div>
              </div>
              <strong>${formatCurrency(product.price)}</strong>
              <label class="admin-inline-field">
                <input type="number" min="0" value="${Number(product.stock || 0)}" data-product-stock="${product.databaseId}">
              </label>
              <div>
                ${statusBadge('product', product.status)}
                <select data-product-status="${product.databaseId}">${productStatusOptions(product.status)}</select>
              </div>
              <label class="admin-switch">
                <input type="checkbox" data-product-featured="${product.databaseId}" ${product.isFeatured ? 'checked' : ''}>
                <span></span>
              </label>
            </article>
          `,
        )
        .join('')}
    </div>
  `;
}

function renderProducts(data) {
  root.innerHTML = `
    <div class="admin-page-head">
      <div>
        <h1>Sản phẩm</h1>
        <p>Quản lý trạng thái bán, tồn kho và sản phẩm nổi bật.</p>
      </div>
      <span class="admin-count">${data.pagination.total} sản phẩm</span>
    </div>
    ${renderFilters()}
    <section class="admin-panel">
      ${renderProductRows(data.items || [])}
      ${renderPagination(data.pagination, 'products-page')}
    </section>
  `;
}

async function loadProducts() {
  if (!root) return;
  root.innerHTML = '<div class="admin-loading">Đang tải sản phẩm...</div>';

  try {
    const response = await apiFetch(`/admin/products?${buildQuery().toString()}`);
    renderProducts(response.data);
    window.history.replaceState(null, '', `products.html?${buildQuery().toString()}`);
  } catch (error) {
    root.innerHTML = renderAdminError(error);
  }
}

async function patchProduct(id, body, target) {
  target.disabled = true;

  try {
    await apiFetch(`/admin/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    await loadProducts();
  } catch (error) {
    target.disabled = false;
    window.alert(error.message || 'Không cập nhật được sản phẩm.');
  }
}

root?.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-product-filters]');
  if (!form) return;

  event.preventDefault();
  const formData = new FormData(form);
  state = {
    page: 1,
    search: formData.get('search')?.toString().trim() || '',
    status: formData.get('status')?.toString() || 'ALL',
  };
  loadProducts();
});

root?.addEventListener('click', (event) => {
  const pageButton = event.target.closest('[data-products-page]');
  if (!pageButton) return;

  state.page = Number(pageButton.dataset.productsPage || 1);
  loadProducts();
});

root?.addEventListener('change', (event) => {
  const status = event.target.closest('[data-product-status]');
  const featured = event.target.closest('[data-product-featured]');

  if (status) {
    patchProduct(status.dataset.productStatus, { status: status.value }, status);
    return;
  }

  if (featured) {
    patchProduct(featured.dataset.productFeatured, { isFeatured: featured.checked }, featured);
  }
});

root?.addEventListener('focusout', (event) => {
  const stock = event.target.closest('[data-product-stock]');
  if (!stock) return;

  patchProduct(stock.dataset.productStock, { stock: Number(stock.value || 0) }, stock);
});

loadProducts();
