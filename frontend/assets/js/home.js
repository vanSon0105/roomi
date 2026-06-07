import { products } from './data.js';
import { observeReveal, productCard, renderShell } from './common.js?v=nav-public-1';

renderShell('home');

const bestSellerGrid = document.querySelector('#bestSellerGrid');

if (bestSellerGrid) {
  bestSellerGrid.innerHTML = products.slice(0, 6).map(productCard).join('');
}

observeReveal();
