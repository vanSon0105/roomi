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
} from './admin-common.js?v=admin-payment-cancel-1';

renderAdminShell('products');

const root = document.querySelector('#adminProducts');
const params = new URLSearchParams(window.location.search);
let state = {
  page: Number(params.get('page') || 1),
  search: params.get('search') || '',
  status: params.get('status') || 'ALL',
};

function buildQuery() {
  const query = new URLSearchParams({ page: String(state.page), limit: '14', status: state.status || 'ALL' });
  if (state.search) query.set('search', state.search);
  return query;
}

function renderFilters() {
  return `
    <form class="admin-filters" data-product-filters>
      <label><span>Tìm sản phẩm</span><input name="search" type="search" value="${escapeHtml(state.search)}" placeholder="Tên, SKU, slug"></label>
      <label><span>Trạng thái</span><select name="status">${productStatusOptions(state.status, { includeAll: true })}</select></label>
      <button class="admin-primary-link" type="submit">Lọc</button>
      <button class="btn btn-maroon" type="button" data-product-create style="margin-left:auto">+ Thêm sản phẩm</button>
    </form>`;
}

function renderProductRows(products) {
  if (!products.length) return renderAdminEmpty('Không tìm thấy sản phẩm.');
  return `
    <div class="admin-table admin-products-table">
      <div class="admin-table-head">
        <span>Sản phẩm</span><span>Giá</span><span>Kho</span><span>Trạng thái</span><span>Nổi bật</span><span></span>
      </div>
      ${products.map(p => `
        <article class="admin-table-row">
          <div class="admin-product-mini">
            <span class="admin-thumb">${p.imageUrl ? `<img src="${mediaUrl(p.imageUrl)}" alt="${escapeHtml(p.name)}">` : ''}</span>
            <div><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.sku || p.slug)}</small></div>
          </div>
          <strong>${formatCurrency(p.price)}</strong>
          <label class="admin-inline-field"><input type="number" min="0" value="${Number(p.stock||0)}" data-product-stock="${p.databaseId}"></label>
          <div>${statusBadge('product', p.status)}<select data-product-status="${p.databaseId}">${productStatusOptions(p.status)}</select></div>
          <label class="admin-switch"><input type="checkbox" data-product-featured="${p.databaseId}" ${p.isFeatured?'checked':''}><span></span></label>
          <div class="admin-row-actions">
            <button type="button" data-product-edit="${p.databaseId}" class="admin-icon-btn" title="Sửa">✏️</button>
            <button type="button" data-product-delete="${p.databaseId}" data-product-name="${escapeHtml(p.name)}" class="admin-icon-btn admin-icon-btn--danger" title="Xoá">🗑️</button>
          </div>
        </article>
      `).join('')}
    </div>`;
}

function renderProducts(data) {
  root.innerHTML = `
    <div class="admin-page-head"><div><h1>Sản phẩm</h1><p>Quản lý sản phẩm, giá, tồn kho.</p></div><span class="admin-count">${data.pagination.total} sản phẩm</span></div>
    ${renderFilters()}
    <section class="admin-panel">${renderProductRows(data.items||[])}${renderPagination(data.pagination,'products-page')}</section>
    <aside class="admin-drawer" data-product-drawer aria-hidden="true"></aside>
  `;
}

// --- Product Form (Create / Edit) ---
function productFormHtml(product = null) {
  const isEdit = !!product;
  const images = product?.images || [];
  return `
    <button class="admin-drawer-close" type="button" data-drawer-close>&times;</button>
    <div class="admin-drawer-head"><span>Sản phẩm</span><h2>${isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2></div>
    <form class="admin-drawer-form" data-product-form>
      <label><span>Tên sản phẩm *</span><input class="roomi-input" name="name" value="${escapeHtml(product?.name||'')}" required></label>
      <label><span>Slug</span><input class="roomi-input" name="slug" value="${escapeHtml(product?.slug||'')}" placeholder="Để trống để tự sinh"></label>
      <label><span>SKU</span><input class="roomi-input" name="sku" value="${escapeHtml(product?.sku||'')}"></label>
      <label><span>Giá *</span><input class="roomi-input" name="price" type="number" min="0" value="${product?.price||0}" required></label>
      <label><span>Giá so sánh</span><input class="roomi-input" name="compareAtPrice" type="number" min="0" value="${product?.compareAtPrice||''}"></label>
      <label><span>Tồn kho</span><input class="roomi-input" name="stock" type="number" min="0" value="${product?.stock||0}"></label>
      <label><span>Mô tả ngắn</span><textarea class="roomi-input" name="shortDescription" rows="2">${escapeHtml(product?.shortDescription||'')}</textarea></label>
      <label><span>Mô tả</span><textarea class="roomi-input" name="description" rows="4">${escapeHtml(product?.description||'')}</textarea></label>
      <label><span>Trạng thái</span><select name="status">${productStatusOptions(product?.status||'ACTIVE')}</select></label>
      <label class="admin-switch"><strong>Nổi bật</strong><input type="checkbox" name="isFeatured" ${product?.isFeatured?'checked':''}><span></span></label>

      ${isEdit ? `
        <div class="admin-product-images">
          <span>Ảnh sản phẩm</span>
          <div class="admin-product-images-grid" data-product-images-grid>
            ${images.map(img => `
              <div class="admin-product-image-item">
                <img src="${mediaUrl(img.imageUrl)}" alt="${escapeHtml(img.altText||'')}">
                <button type="button" class="admin-product-image-delete" data-delete-image="${img.id}" title="Xoá ảnh">&times;</button>
              </div>
            `).join('')}
          </div>
          <label class="admin-product-image-add">
            <input type="file" name="images" accept="image/*" multiple data-product-image-upload>
            <span>+ Thêm ảnh</span>
          </label>
          <div class="admin-product-image-preview" data-product-image-preview></div>
        </div>
      ` : '<p class="admin-muted" style="font-size:13px">Lưu sản phẩm trước rồi mới thêm ảnh sau.</p>'}

      <div class="admin-drawer-actions">
        <button class="btn btn-maroon" type="submit">${isEdit ? 'Cập nhật' : 'Tạo sản phẩm'}</button>
        <span class="admin-settings-feedback" data-product-feedback></span>
      </div>
    </form>`;
}

function openDrawer(html) {
  const drawer = document.querySelector('[data-product-drawer]');
  if (!drawer) return;
  drawer.innerHTML = html;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  const drawer = document.querySelector('[data-product-drawer]');
  drawer?.classList.remove('is-open');
  drawer?.setAttribute('aria-hidden', 'true');
}

// --- API ---
async function loadProducts() {
  if (!root) return;
  root.innerHTML = '<div class="admin-loading">Đang tải sản phẩm...</div>';
  try {
    const r = await apiFetch(`/admin/products?${buildQuery()}`);
    renderProducts(r.data);
    window.history.replaceState(null, '', `products.html?${buildQuery()}`);
  } catch (e) { root.innerHTML = renderAdminError(e); }
}

async function patchProduct(id, body, target) {
  target.disabled = true;
  try { await apiFetch(`/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }); await loadProducts(); }
  catch (e) { target.disabled = false; window.alert(e.message || 'Lỗi.'); }
}

// --- Events ---
root?.addEventListener('submit', e => {
  const filterForm = e.target.closest('[data-product-filters]');
  const productForm = e.target.closest('[data-product-form]');
  if (filterForm) {
    e.preventDefault();
    const fd = new FormData(filterForm);
    state = { page: 1, search: fd.get('search')?.toString().trim()||'', status: fd.get('status')?.toString()||'ALL' };
    loadProducts();
  }
  if (productForm) {
    e.preventDefault();
    const fd = new FormData(productForm);
    const feedback = productForm.querySelector('[data-product-feedback]');
    const btn = productForm.querySelector('[type="submit"]');
    const isEdit = !!productForm.dataset.productId;
    const body = {
      name: fd.get('name'), slug: fd.get('slug')||undefined, sku: fd.get('sku')||null,
      price: Number(fd.get('price')), compareAtPrice: fd.get('compareAtPrice') ? Number(fd.get('compareAtPrice')) : null,
      stock: Number(fd.get('stock')), shortDescription: fd.get('shortDescription')||null,
      description: fd.get('description')||null, status: fd.get('status'),
      isFeatured: fd.get('isFeatured') === 'on',
    };
    btn.disabled = true; btn.textContent = isEdit ? 'Đang cập nhật...' : 'Đang tạo...';
    (async () => {
      try {
        if (isEdit) {
          await apiFetch(`/admin/products/${productForm.dataset.productId}`, { method: 'PATCH', body: JSON.stringify(body) });
        } else {
          await apiFetch('/admin/products', { method: 'POST', body: JSON.stringify(body) });
        }
        closeDrawer(); await loadProducts();
      } catch (err) {
        if (feedback) feedback.textContent = err.message || 'Lỗi.';
        btn.disabled = false; btn.textContent = isEdit ? 'Cập nhật' : 'Tạo sản phẩm';
      }
    })();
  }
});

root?.addEventListener('click', e => {
  const pageBtn = e.target.closest('[data-products-page]');
  const createBtn = e.target.closest('[data-product-create]');
  const editBtn = e.target.closest('[data-product-edit]');
  const deleteBtn = e.target.closest('[data-product-delete]');
  const closeBtn = e.target.closest('[data-drawer-close]');

  if (pageBtn) { state.page = Number(pageBtn.dataset.productsPage||1); loadProducts(); }
  if (closeBtn) { closeDrawer(); }
  if (createBtn) { openDrawer(productFormHtml()); }
  if (editBtn) {
    const id = Number(editBtn.dataset.productEdit);
    (async () => {
      editBtn.disabled = true;
      try {
        const r = await apiFetch(`/admin/products/${id}`);
        const product = r.data;
        const div = document.createElement('div');
        div.innerHTML = productFormHtml(product);
        div.querySelector('[data-product-form]').dataset.productId = String(id);
        openDrawer(div.innerHTML);
      } catch (err) { window.alert(err.message); }
      finally { editBtn.disabled = false; }
    })();
  }
  if (deleteBtn) {
    const id = Number(deleteBtn.dataset.productDelete);
    const name = deleteBtn.dataset.productName;
    if (!window.confirm(`Xoá sản phẩm "${name}"? Hành động này không thể hoàn tác.`)) return;
    deleteBtn.disabled = true;
    (async () => {
      try { await apiFetch(`/admin/products/${id}`, { method: 'DELETE' }); await loadProducts(); }
      catch (err) { deleteBtn.disabled = false; window.alert(err.message||'Không xoá được.'); }
    })();
  }
});

root?.addEventListener('change', e => {
  const imgUpload = e.target.closest('[data-product-image-upload]');
  if (imgUpload) {
    const files = imgUpload.files;
    if (!files.length) return;
    const productId = imgUpload.closest('[data-product-form]')?.dataset.productId;
    if (!productId) return;
    uploadProductImages(Number(productId), files);
    return;
  }
  const status = e.target.closest('[data-product-status]');
  const featured = e.target.closest('[data-product-featured]');
  if (status) patchProduct(status.dataset.productStatus, { status: status.value }, status);
  if (featured) patchProduct(featured.dataset.productFeatured, { isFeatured: featured.checked }, featured);
});

root?.addEventListener('focusout', e => {
  const stock = e.target.closest('[data-product-stock]');
  if (stock) patchProduct(stock.dataset.productStock, { stock: Number(stock.value||0) }, stock);
});

async function uploadProductImages(productId, files) {
  const formData = new FormData();
  for (const file of files) formData.append('images', file);
  try {
    const r = await fetch(`/api/admin/products/${productId}/images`, { method: 'POST', credentials: 'include', body: formData });
    const payload = await r.json();
    if (!r.ok) throw new Error(payload.message || 'Lỗi tải ảnh');
    const div = document.createElement('div');
    div.innerHTML = productFormHtml(payload.data);
    div.querySelector('[data-product-form]').dataset.productId = String(productId);
    openDrawer(div.innerHTML);
    await loadProducts();
  } catch (err) { window.alert(err.message); }
}

root?.addEventListener('click', async e => {
  const delImg = e.target.closest('[data-delete-image]');
  if (delImg) {
    const imageId = Number(delImg.dataset.deleteImage);
    const productId = Number(delImg.closest('[data-product-form]')?.dataset.productId);
    if (!productId || !imageId) return;
    delImg.disabled = true;
    try {
      const r = await apiFetch(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' });
      const div = document.createElement('div');
      div.innerHTML = productFormHtml(r.data);
      div.querySelector('[data-product-form]').dataset.productId = String(productId);
      openDrawer(div.innerHTML);
      await loadProducts();
    } catch (err) { delImg.disabled = false; window.alert(err.message); }
    return;
  }
});

loadProducts();
