import { formatCurrency } from './data.js';

export const API_BASE = '/api';
  // window.ROOMI_API_BASE ||
  // (window.location.protocol.startsWith('http') && window.location.port === '4000'
  //   ? '/api'
  //   : 'http://localhost:4000/api');

const rootPrefix = '';
const cartIconSrc = `${rootPrefix}assets/images/cart-icon.png`;
const userIconSrc = `${rootPrefix}assets/images/user-icon.png`;
const chatIconSrc = `${rootPrefix}assets/images/figma/homepage/chat icon.png`;

function active(page, id) {
  return page === id ? 'is-active' : '';
}

export function protectedHref(path) {
  return path;
}

export function requireAuth() {
  return true;
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message || 'Request failed');
    error.status = response.status;
    error.data = payload?.data || null;
    throw error;
  }

  return payload;
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function redirectToLogin() {
  const currentPage = `${window.location.pathname.split('/').pop() || 'index.html'}${window.location.search}`;
  window.location.href = `login.html?redirect=${encodeURIComponent(currentPage)}`;
}

export function mediaUrl(path) {
  if (!path) {
    return '';
  }

  if (/^(https?:|data:|blob:)/.test(path)) {
    return path;
  }

  return `${rootPrefix}${path.replace(/^\/+/, '')}`;
}

export function renderShell(page = '') {
  const headerSlot = document.querySelector('[data-header]');
  const footerSlot = document.querySelector('[data-footer]');
  const chatSlot = document.querySelector('[data-chat]');
  const accountDesktopLink = `
    <a class="nav-account ${active(page, 'login')}" href="login.html" data-account-link>
      <span data-account-text>Đăng nhập</span>
      <img class="nav-account-icon" src="${userIconSrc}" alt="" data-account-icon hidden>
    </a>
  `;
  const accountMobileLink = `<a style="--delay:400ms" class="${active(page, 'login')}" href="login.html" data-mobile-account-link>Đăng nhập</a>`;
  const cartDesktopLink = `
    <a class="nav-icon nav-cart ${active(page, 'cart')}" href="cart.html" aria-label="Giỏ hàng">
      <img src="${cartIconSrc}" alt="">
    </a>
  `;

  if (headerSlot) {
    headerSlot.innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a class="brand-link" href="index.html" aria-label="ROOMI trang chủ">
            <img src="${rootPrefix}assets/images/figma/logo-roomi-navbar.png" alt="ROOMI">
          </a>
          <form class="search-pill" role="search">
            <input aria-label="Tìm kiếm sản phẩm" type="search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
          </form>
          <nav class="desktop-nav" aria-label="Điều hướng chính">
            <a class="${active(page, 'products')}" href="products.html">Sản phẩm</a>
            <a class="${active(page, 'about')}" href="about.html">Về chúng tôi</a>
            <a class="${active(page, 'room-3d')}" href="room-3d.html">Mô phỏng 3D</a>
            ${cartDesktopLink}
            ${accountDesktopLink}
          </nav>
          <button class="menu-trigger" type="button" aria-label="Mở menu" data-menu-open>
            <span></span><span></span><span></span>
          </button>
        </div>
        <aside class="mobile-drawer" data-mobile-drawer aria-hidden="true">
          <div class="mobile-drawer-head">
            <img src="${rootPrefix}assets/images/figma/logo-roomi-navbar.png" alt="ROOMI">
            <button type="button" aria-label="Đóng menu" data-menu-close><i class="ph-bold ph-x"></i></button>
          </div>
          <nav>
            <a style="--delay:120ms" class="${active(page, 'products')}" href="products.html">Sản phẩm</a>
            <a style="--delay:190ms" class="${active(page, 'about')}" href="about.html">Về chúng tôi</a>
            <a style="--delay:260ms" class="${active(page, 'room-3d')}" href="room-3d.html">Mô phỏng 3D</a>
            <a style="--delay:330ms" class="${active(page, 'cart')}" href="cart.html">Giỏ hàng</a>
            ${accountMobileLink}
          </nav>
        </aside>
      </header>
    `;
  }

  if (footerSlot) {
    footerSlot.innerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-logo">
            <a href="index.html">
              <img src="${rootPrefix}assets/images/figma/logo-roomi-footer.png" alt="ROOMI">
            </a>
          </div>
          <div class="footer-body">
            <div class="footer-body-small">
              <div class="footer-column">
                <h3>Chính sách</h3>
                <a href="#">Chính sách bảo mật</a>
                <a href="#">Chính sách vận chuyển</a>
                <a href="#">Chính sách đổi trả</a>
                <a href="#">Quy định sử dụng</a>
              </div>
              <div class="footer-column">
                <h3>Hướng dẫn</h3>
                <a href="#">Hướng dẫn thanh toán</a>
                <a href="#">Hướng dẫn khách hàng</a>
                <a href="#">Hướng dẫn giao nhận</a>
                
              </div>
              <div class="footer-column">
                <h3>Hỗ trợ khách hàng</h3>
                <a href="tel:0966067593"><i class="ph-fill ph-phone"></i>0966067593</a>
                <a href="mailto:cskh@roomi.com.vn"><i class="ph-fill ph-envelope-simple"></i>cskh@roomi.com.vn</a>
              </div>
            </div>
            <div class="social-row">
              <strong>Theo dõi chúng tôi</strong>
              <a href="#" aria-label="Facebook"><i class="ph-fill ph-facebook-logo"></i></a>
              <a href="#" aria-label="Tiktok"><i class="ph-fill ph-tiktok-logo"></i></a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  if (chatSlot) {
    chatSlot.innerHTML = `
      <button class="chat-button" type="button" data-chat-button aria-label="Mở chat">
        <img src="${chatIconSrc}" alt="">
      </button>
      <aside class="chat-panel" data-chat-panel aria-hidden="true">
        <div class="chat-line">
          <div class="chat-avatar">R</div>
          <p class="chat-bubble dark">Hi bạn, đang muốn decor vibe gì nè?</p>
        </div>
        <div class="chat-line right">
          <p class="chat-bubble light">Add Name & Type Something...</p>
          <div class="chat-avatar">B</div>
        </div>
        <div class="chat-line">
          <div class="chat-avatar">A</div>
          <p class="chat-bubble dark">Decor phòng ngủ hay góc chill vậy?</p>
        </div>
      </aside>
    `;
  }

  bindCommonInteractions();
  syncAccountState();
  observeReveal();
}

function markAuthenticatedAccount(user) {
  const accountLabel = user?.email ? `Tài khoản ${user.email}` : 'Tài khoản';

  document.querySelectorAll('[data-account-link]').forEach((link) => {
    link.classList.add('is-authenticated');
    link.href = '#';
    link.setAttribute('aria-label', accountLabel);
    link.setAttribute('title', accountLabel);
    link.addEventListener('click', (event) => event.preventDefault());

    const text = link.querySelector('[data-account-text]');
    const icon = link.querySelector('[data-account-icon]');

    if (text) {
      text.textContent = '';
    }

    if (icon) {
      icon.hidden = false;
    }
  });

  document.querySelectorAll('[data-mobile-account-link]').forEach((link) => {
    link.classList.add('is-authenticated');
    link.href = '#';
    link.textContent = 'Tài khoản';
    link.setAttribute('aria-label', accountLabel);
    link.addEventListener('click', (event) => event.preventDefault());
  });
}

async function syncAccountState() {
  if (!document.querySelector('[data-account-link], [data-mobile-account-link]')) {
    return;
  }

  try {
    const payload = await apiFetch('/auth/me');
    const user = payload?.data?.user;

    if (user) {
      markAuthenticatedAccount(user);
    }
  } catch (_error) {
    // No session yet: keep the public login link.
  }
}

export function stars(rating) {
  const score = Math.round(Number(rating) || 0);
  return Array.from({ length: 5 }, (_, index) => `<span class="${index < score ? '' : 'off'}">&#9733;</span>`).join('');
}

export function productArt(label = 'Ảnh sản phẩm', imageUrl = '') {
  const safeLabel = escapeHtml(label);
  const safeImageUrl = mediaUrl(imageUrl);

  return `
    <div class="product-art" aria-label="${safeLabel}">
      ${
        safeImageUrl
          ? `<img src="${escapeHtml(safeImageUrl)}" alt="${safeLabel}" loading="lazy">`
          : '<div class="product-placeholder"></div>'
      }
    </div>
  `;
}

export function miniArt(label = 'Ảnh sản phẩm', imageUrl = '') {
  const safeLabel = escapeHtml(label);
  const safeImageUrl = mediaUrl(imageUrl);

  return `
    <div class="mini-art" aria-label="${safeLabel}">
      ${safeImageUrl ? `<img src="${escapeHtml(safeImageUrl)}" alt="${safeLabel}" loading="lazy">` : ''}
    </div>
  `;
}

export function productCard(product, index = 0) {
  const slug = product.slug || product.id;
  const categoryText = product.categoryLabel || product.category || '';

  return `
    <a class="product-card" style="--index:${index}" href="product-detail.html?id=${encodeURIComponent(slug)}" aria-label="${escapeHtml(product.name)}">
      ${productArt(product.name, product.imageUrl)}
      <div class="product-info">
        <h3>${escapeHtml(product.name)}</h3>
        <div class="stars">${stars(product.rating)}</div>
        <div class="product-meta">
          <strong>${formatCurrency(product.price)}</strong>
          <span>${escapeHtml(categoryText)}</span>
        </div>
      </div>
    </a>
  `;
}

function bindCommonInteractions() {
  const drawer = document.querySelector('[data-mobile-drawer]');
  document.querySelector('[data-menu-open]')?.addEventListener('click', () => {
    drawer?.classList.add('is-open');
    drawer?.setAttribute('aria-hidden', 'false');
  });
  document.querySelector('[data-menu-close]')?.addEventListener('click', () => {
    drawer?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true');
  });

  const chatPanel = document.querySelector('[data-chat-panel]');
  document.querySelector('[data-chat-button]')?.addEventListener('click', () => {
    chatPanel?.classList.toggle('is-open');
    chatPanel?.setAttribute('aria-hidden', chatPanel.classList.contains('is-open') ? 'false' : 'true');
  });
}

export function observeReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targets = document.querySelectorAll('.reveal, .product-card, .media-reveal');

  if (reduceMotion) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 },
  );

  targets.forEach((target) => observer.observe(target));
}
