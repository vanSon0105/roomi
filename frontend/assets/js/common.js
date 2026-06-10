import { formatCurrency } from './data.js';

export const API_BASE = '/api';
  // window.ROOMI_API_BASE ||
  // (window.location.protocol.startsWith('http') && window.location.port === '4000'
  //   ? '/api'
  //   : 'http://localhost:4000/api');

const normalizedPathname = window.location.pathname.replace(/\\/g, '/');
const isInAdminPages = normalizedPathname.includes('/pages/admin/');
const isInPages = normalizedPathname.includes('/pages/');
const rootPrefix = isInAdminPages ? '../../' : isInPages ? '../' : '';
const pagePrefix = isInAdminPages ? '../' : isInPages ? '' : 'pages/';
const cartIconSrc = `${rootPrefix}assets/images/cart-icon.png`;
const userIconSrc = `${rootPrefix}assets/images/user-icon.png`;
const chatIconSrc = `${rootPrefix}assets/images/figma/homepage/chat icon.png`;

function active(page, id) {
  return page === id ? 'is-active' : '';
}

export function protectedHref(path) {
  return pageHref(path);
}

export function requireAuth() {
  return true;
}

export const homeHref = `${rootPrefix}index.html`;

export function pageHref(path) {
  if (!path || path === 'index.html') {
    return homeHref;
  }

  const normalizedPath = path.replace(/^\/+/, '');

  if (isInAdminPages && normalizedPath.startsWith('admin/')) {
    return normalizedPath.replace(/^admin\//, '');
  }

  return `${pagePrefix}${normalizedPath}`;
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
  const pagesMarker = '/pages/';
  const pagesIndex = normalizedPathname.indexOf(pagesMarker);
  const currentPath =
    pagesIndex >= 0
      ? normalizedPathname.slice(pagesIndex + pagesMarker.length) || 'index.html'
      : normalizedPathname.split('/').pop() || 'index.html';
  const currentPage = `${currentPath}${window.location.search}`;
  window.location.href = `${pageHref('login.html')}?redirect=${encodeURIComponent(currentPage)}`;
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
    <a class="nav-account ${active(page, 'login') || active(page, 'account')}" href="${pageHref('login.html')}" data-account-link>
      <span data-account-text>Đăng nhập</span>
      <img class="nav-account-icon" src="${userIconSrc}" alt="" data-account-icon hidden>
    </a>
  `;
  const adminDesktopLink = `
    <a class="nav-icon nav-admin-link" href="${pageHref('admin/dashboard.html')}" aria-label="Trang qu\u1ea3n tr\u1ecb" title="Trang qu\u1ea3n tr\u1ecb" data-admin-link hidden>
      <i class="ph ph-gauge" aria-hidden="true"></i>
    </a>
  `;
  const accountMobileLink = `<a style="--delay:400ms" class="${active(page, 'login')}" href="${pageHref('login.html')}" data-mobile-account-link>Đăng nhập</a>`;
  const adminMobileLink = `<a style="--delay:470ms" href="${pageHref('admin/dashboard.html')}" data-mobile-admin-link hidden>Qu\u1ea3n tr\u1ecb</a>`;
  const cartDesktopLink = `
    <a class="nav-icon nav-cart ${active(page, 'cart')}" href="${pageHref('cart.html')}" aria-label="Giỏ hàng">
      <img src="${cartIconSrc}" alt="">
    </a>
  `;

  if (headerSlot) {
    headerSlot.innerHTML = `
      <header class="site-header">
        <div class="header-inner">
          <a class="brand-link" href="${homeHref}" aria-label="ROOMI trang chủ">
            <img src="${rootPrefix}assets/images/figma/logo-roomi-navbar.png" alt="ROOMI">
          </a>
          <form class="search-pill" role="search">
            <input aria-label="Tìm kiếm sản phẩm" type="search">
            <i class="ph ph-magnifying-glass" aria-hidden="true"></i>
          </form>
          <nav class="desktop-nav" aria-label="Điều hướng chính">
            <a class="${active(page, 'products')}" href="${pageHref('products.html')}">Sản phẩm</a>
            <a class="${active(page, 'about')}" href="${pageHref('about.html')}">Về chúng tôi</a>
            <a class="${active(page, 'room-3d')}" href="${pageHref('room-3d.html')}">Mô phỏng 3D</a>
            ${cartDesktopLink}
            ${accountDesktopLink}
            ${adminDesktopLink}
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
            <a style="--delay:120ms" class="${active(page, 'products')}" href="${pageHref('products.html')}">Sản phẩm</a>
            <a style="--delay:190ms" class="${active(page, 'about')}" href="${pageHref('about.html')}">Về chúng tôi</a>
            <a style="--delay:260ms" class="${active(page, 'room-3d')}" href="${pageHref('room-3d.html')}">Mô phỏng 3D</a>
            <a style="--delay:330ms" class="${active(page, 'cart')}" href="${pageHref('cart.html')}">Giỏ hàng</a>
            ${accountMobileLink}
            ${adminMobileLink}
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
            <a href="${homeHref}">
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
        <div class="chat-messages" data-chat-messages></div>
        <form class="chat-send" data-chat-form>
          <input name="message" placeholder="Nhập tin nhắn..." autocomplete="off" required>
          <button type="submit">Gửi</button>
        </form>
      </aside>
    `;
  }

  bindCommonInteractions();
  syncAccountState();
  observeReveal();
  initChatPolling();
}

function markAuthenticatedAccount(user) {
  const accountLabel = user?.email ? `T\u00e0i kho\u1ea3n ${user.email}` : 'T\u00e0i kho\u1ea3n';
  const accountHref = pageHref('account.html');
  const avatarSrc = user?.avatarUrl ? mediaUrl(user.avatarUrl) : userIconSrc;

  document.querySelectorAll('[data-account-link]').forEach((link) => {
    link.classList.add('is-authenticated');
    link.href = accountHref;
    link.setAttribute('aria-label', accountLabel);
    link.setAttribute('title', accountLabel);

    const text = link.querySelector('[data-account-text]');
    const icon = link.querySelector('[data-account-icon]');

    if (text) {
      text.textContent = '';
    }

    if (icon) {
      icon.src = avatarSrc;
      icon.hidden = false;
      icon.classList.toggle('is-avatar', Boolean(user?.avatarUrl));
    }
  });

  document.querySelectorAll('[data-mobile-account-link]').forEach((link) => {
    link.classList.add('is-authenticated');
    link.href = accountHref;
    link.textContent = 'T\u00e0i kho\u1ea3n';
    link.setAttribute('aria-label', accountLabel);
  });

  if (user?.role === 'ADMIN') {
    currentUserIsAdmin = true;
    document.querySelectorAll('[data-admin-link], [data-mobile-admin-link]').forEach((link) => {
      link.hidden = false;
    });
    pollUnreadCount();
  }
}

let unreadPollTimer = null;

async function pollUnreadCount() {
  if (unreadPollTimer) clearTimeout(unreadPollTimer);
  try {
    const r = await fetch('/api/admin/chat/unread', { credentials: 'include' }).then(r => r.json());
    const count = r?.data?.count || 0;
    const badge = document.querySelector('[data-chat-badge]');
    const button = document.querySelector('[data-chat-button]');
    if (count > 0) {
      if (!badge) {
        const span = document.createElement('span');
        span.setAttribute('data-chat-badge', '');
        span.className = 'chat-badge';
        button?.appendChild(span);
      }
      const el = badge || document.querySelector('[data-chat-badge]');
      if (el) el.textContent = count > 99 ? '99+' : String(count);
    } else if (badge) {
      badge.remove();
    }
  } catch (_) {}
  unreadPollTimer = setTimeout(pollUnreadCount, 15000);
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
    <a class="product-card" style="--index:${index}" href="${pageHref('product-detail.html')}?id=${encodeURIComponent(slug)}" aria-label="${escapeHtml(product.name)}">
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

  // Chat toggle handled in initChatPolling
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

// --- Chat ---
let chatPollTimer = null;

function getChatGuestId() {
  let id = localStorage.getItem('roomi_chat_guest');
  if (!id) {
    id = 'g' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem('roomi_chat_guest', id);
  }
  return id;
}

function chatApiFetch(path, options = {}) {
  const separator = path.includes('?') ? '&' : '?';
  return fetch(`/api/chat${path}${separator}guestId=${getChatGuestId()}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  }).then((r) => r.json());
}

function escapeChatHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function chatAvatarUrl(url) {
  if (!url) return null;
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `${rootPrefix}${url.replace(/^\/+/, '')}`;
}

function chatAvatarHtml(msg) {
  const avatarUrl = chatAvatarUrl(msg.user?.avatarUrl);
  const initial = (msg.name || 'K')[0].toUpperCase();
  if (avatarUrl) {
    return `<img class="chat-avatar-img" src="${escapeChatHtml(avatarUrl)}" alt="${initial}" onerror="this.outerHTML='<div class=chat-avatar>${initial}</div>'">`;
  }
  return `<div class="chat-avatar">${initial}</div>`;
}

function renderChatMessages(messages) {
  const container = document.querySelector('[data-chat-messages]');
  if (!container) return;
  if (!messages.length) {
    container.innerHTML = '<p class="chat-muted">Hãy bắt đầu chat với admin nếu có vấn đề gì cần giải đáp.</p>';
    return;
  }
  container.innerHTML = messages
    .map(
      (m) => `
        <div class="chat-line ${m.isAdmin ? '' : 'right'}">
          ${m.isAdmin ? chatAvatarHtml(m) : ''}
          <p class="chat-bubble ${m.isAdmin ? 'dark' : 'light'}">${escapeChatHtml(m.message)}</p>
          ${!m.isAdmin ? chatAvatarHtml(m) : ''}
        </div>
      `,
    )
    .join('');
  container.scrollTop = container.scrollHeight;
}

async function loadChatMessages() {
  try {
    const response = await chatApiFetch('');
    if (response.success && response.data) {
      renderChatMessages(response.data);
    }
  } catch (_error) { /* ignore */ }
}

function stopChatPolling() {
  if (chatPollTimer) {
    window.clearTimeout(chatPollTimer);
    chatPollTimer = null;
  }
}

function initChatPolling() {
  const panel = document.querySelector('[data-chat-panel]');
  const button = document.querySelector('[data-chat-button]');
  if (!panel || !button) return;

  button.addEventListener('click', async () => {
    // Admin → redirect to admin chat page
    if (currentUserIsAdmin) {
      window.location.href = pageHref('admin/chat.html');
      return;
    }
    // Double-check in case sync hasn't completed yet
    try {
      const r = await fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json());
      if (r?.data?.user?.role === 'ADMIN') {
        window.location.href = pageHref('admin/chat.html');
        return;
      }
    } catch (_) {}

    const isOpening = !panel.classList.contains('is-open');
    panel.classList.toggle('is-open');
    panel.setAttribute('aria-hidden', panel.classList.contains('is-open') ? 'false' : 'true');
    if (isOpening) {
      loadChatMessages();
      stopChatPolling();
      pollChat();
    }
  });

  const pollChat = async () => {
    if (!panel.classList.contains('is-open')) {
      chatPollTimer = window.setTimeout(pollChat, 3000);
      return;
    }
    await loadChatMessages();
    chatPollTimer = window.setTimeout(pollChat, 3000);
  };
}

function bindChatForm() {
  const form = document.querySelector('[data-chat-form]');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = form.querySelector('input');
    const message = input.value.trim();
    if (!message) return;

    const button = form.querySelector('button');
    input.disabled = true;
    button.disabled = true;

    try {
      await chatApiFetch('', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      input.value = '';
      await loadChatMessages();
    } catch (_error) { /* ignore */ }
    finally {
      input.disabled = false;
      button.disabled = false;
      input.focus();
    }
  });
}

// Bind chat form after DOM is ready
let chatFormBound = false;
let currentUserIsAdmin = false;
document.addEventListener('DOMContentLoaded', () => {
  if (!chatFormBound) { bindChatForm(); chatFormBound = true; }
});
window.addEventListener('load', () => {
  if (!chatFormBound) { bindChatForm(); chatFormBound = true; }
});

