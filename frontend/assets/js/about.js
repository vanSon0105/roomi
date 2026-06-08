import { formatCurrency } from './data.js';
import { apiFetch, escapeHtml, mediaUrl, observeReveal, pageHref, renderShell } from './common.js?v=pages-path-1';

renderShell('about');

const AUTOPLAY_DELAY = 2000;

const carousel = document.querySelector('[data-about-carousel]');
const bestSellerStrip = document.querySelector('#aboutBestSellerStrip');
const prevButton = document.querySelector('[data-about-carousel-prev]');
const nextButton = document.querySelector('[data-about-carousel-next]');

let activeSlide = 0;
let slideCount = 0;
let autoplayTimer = null;
let resizeTimer = null;

function aboutSaleCard(product, index) {
  const slug = product.slug || product.id;
  const imageUrl = mediaUrl(product.imageUrl);
  const activeClass = index === activeSlide ? ' is-active' : '';

  return `
    <a class="about-sale-card${activeClass}" href="${pageHref('product-detail.html')}?id=${encodeURIComponent(slug)}" aria-label="${escapeHtml(product.name)}">
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy">` : '<div class="about-sale-media" aria-hidden="true"></div>'}
      <span>SALE</span>
      <h3>${escapeHtml(product.name)}</h3>
      <p>${formatCurrency(product.price)}</p>
    </a>
  `;
}

function stopAutoplay() {
  if (!autoplayTimer) return;

  window.clearInterval(autoplayTimer);
  autoplayTimer = null;
}

function startAutoplay() {
  stopAutoplay();

  const metrics = getCarouselMetrics();

  if ((metrics?.usableSlideCount || 0) <= 1 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  autoplayTimer = window.setInterval(() => {
    moveCarousel(1, false);
  }, AUTOPLAY_DELAY);
}

function getCarouselMetrics() {
  if (!bestSellerStrip || !carousel) return null;

  const cards = Array.from(bestSellerStrip.querySelectorAll('.about-sale-card:not(.is-empty)'));
  const firstCard = cards[0];
  const viewport = carousel.querySelector('.about-carousel-viewport');

  if (!firstCard || !viewport) return null;

  const stripStyle = window.getComputedStyle(bestSellerStrip);
  const gap = Number.parseFloat(stripStyle.columnGap || stripStyle.gap || '0') || 0;
  const cardWidth = firstCard.getBoundingClientRect().width;
  const viewportWidth = viewport.getBoundingClientRect().width;
  const step = cardWidth + gap;
  const maxScroll = Math.max(0, bestSellerStrip.scrollWidth - viewportWidth);
  const maxSlideIndex = Math.min(cards.length - 1, step > 0 ? Math.ceil(maxScroll / step) : 0);

  return {
    cards,
    maxScroll,
    maxSlideIndex,
    step,
    usableSlideCount: maxSlideIndex + 1,
  };
}

function updateControls(usableSlideCount = 0) {
  prevButton?.toggleAttribute('hidden', usableSlideCount <= 1);
  nextButton?.toggleAttribute('hidden', usableSlideCount <= 1);
}

function updateCarousel({ animate = true } = {}) {
  const metrics = getCarouselMetrics();

  if (!metrics) return;

  activeSlide = Math.min(activeSlide, metrics.maxSlideIndex);

  metrics.cards.forEach((card, index) => card.classList.toggle('is-active', index === activeSlide));
  updateControls(metrics.usableSlideCount);

  const nextScroll = Math.min(activeSlide * metrics.step, metrics.maxScroll);
  const offset = -nextScroll;

  if (!animate) {
    bestSellerStrip.style.transition = 'none';
  }

  bestSellerStrip.style.transform = `translate3d(${offset}px, 0, 0)`;

  if (!animate) {
    window.requestAnimationFrame(() => {
      bestSellerStrip.style.transition = '';
    });
  }
}

function moveCarousel(direction, manual = true) {
  const metrics = getCarouselMetrics();
  const usableSlideCount = metrics?.usableSlideCount || 0;

  if (usableSlideCount <= 1) return;

  activeSlide = (activeSlide + direction + usableSlideCount) % usableSlideCount;
  updateCarousel();

  if (manual) {
    startAutoplay();
  }
}

function bindCarousel() {
  if (!carousel || !bestSellerStrip) return;

  prevButton?.addEventListener('click', () => moveCarousel(-1));
  nextButton?.addEventListener('click', () => moveCarousel(1));

  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => updateCarousel({ animate: false }), 120);
  });
}

function renderAboutProducts(products) {
  if (!bestSellerStrip) return;

  if (!products.length) {
    bestSellerStrip.innerHTML = '<p class="empty-copy">Chưa có sản phẩm bán chạy.</p>';
    slideCount = 0;
    stopAutoplay();
    return;
  }

  activeSlide = 0;
  slideCount = Math.min(products.length, 5);
  bestSellerStrip.innerHTML = products.slice(0, 5).map(aboutSaleCard).join('');
  updateCarousel({ animate: false });
  startAutoplay();
  observeReveal();
}

async function loadAboutProducts() {
  if (!bestSellerStrip) return;

  try {
    let response = await apiFetch('/products?limit=5&featured=true');
    let products = response.data.items || [];

    if (!products.length) {
      response = await apiFetch('/products?limit=5');
      products = response.data.items || [];
    }

    renderAboutProducts(products);
  } catch (error) {
    bestSellerStrip.innerHTML = `<p class="empty-copy">${escapeHtml(error.message || 'Không tải được sản phẩm bán chạy.')}</p>`;
  }
}

observeReveal();
bindCarousel();
loadAboutProducts();
