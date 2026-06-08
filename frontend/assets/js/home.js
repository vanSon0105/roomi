import { apiFetch, escapeHtml, observeReveal, productCard, renderShell } from './common.js?v=chat-icon-1';

renderShell('home');

const bestSellerGrid = document.querySelector('#bestSellerGrid');

async function renderBestSellers() {
  if (!bestSellerGrid) return;

  bestSellerGrid.innerHTML = '<p class="empty-copy">Äang táº£i sáº£n pháº©m...</p>';

  try {
    const response = await apiFetch('/products?limit=6');
    const products = response.data.items;

    bestSellerGrid.innerHTML = products.length
      ? products.map(productCard).join('')
      : '<p class="empty-copy">ChÆ°a cÃ³ sáº£n pháº©m bÃ¡n cháº¡y.</p>';
  } catch (error) {
    bestSellerGrid.innerHTML = `<p class="empty-copy">${escapeHtml(error.message || 'KhÃ´ng táº£i Ä‘Æ°á»£c sáº£n pháº©m.')}</p>`;
  }

  observeReveal();
}

renderBestSellers();

