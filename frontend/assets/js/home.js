import { apiFetch, escapeHtml, observeReveal, productCard, renderShell } from './common.js?v=nav-public-1';

renderShell('home');

const bestSellerGrid = document.querySelector('#bestSellerGrid');

async function renderBestSellers() {
  if (!bestSellerGrid) return;

  bestSellerGrid.innerHTML = '<p class="empty-copy">Đang tải sản phẩm...</p>';

  try {
    const response = await apiFetch('/products?limit=6');
    const products = response.data.items;

    bestSellerGrid.innerHTML = products.length
      ? products.map(productCard).join('')
      : '<p class="empty-copy">Chưa có sản phẩm bán chạy.</p>';
  } catch (error) {
    bestSellerGrid.innerHTML = `<p class="empty-copy">${escapeHtml(error.message || 'Không tải được sản phẩm.')}</p>`;
  }

  observeReveal();
}

renderBestSellers();
