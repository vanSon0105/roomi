import {
  apiFetch,
  escapeHtml,
  formatDate,
  mediaUrl,
  renderAdminShell,
} from './admin-common.js?v=admin-room3d-1';

renderAdminShell('chat');

const root = document.querySelector('#adminChat');
let activeKey = null;
let pollTimer = null;
let conversationsData = [];

function stopPoll() { pollTimer && clearTimeout(pollTimer); }

async function loadConversations() {
  try {
    const r = await apiFetch('/admin/chat/conversations');
    conversationsData = r.data?.conversations || [];
  } catch (_) { conversationsData = []; }
}

async function loadMessages(key) {
  if (!key) return [];
  try {
    const r = await apiFetch(`/admin/chat/${encodeURIComponent(key)}`);
    return r.data || [];
  } catch (_) { return []; }
}

function sidebarHtml() {
  if (!conversationsData.length) {
    return '<p class="admin-muted" style="padding:24px">Chưa có tin nhắn từ khách hàng.</p>';
  }
  return conversationsData.map(c => `
    <button class="admin-chat-user ${c.key === activeKey ? 'is-active' : ''} ${c.isRead ? '' : 'is-unread'}"
            type="button" data-key="${c.key}">
      <strong>${c.isRead ? '' : '<span class="chat-unread-dot"></span>'}${escapeHtml(c.userName)}</strong>
      <span>${escapeHtml((c.lastMessage||'').slice(0,80))}</span>
      <small>${formatDate(c.lastMessageAt)}</small>
    </button>
  `).join('');
}

function avatarHtml(msg) {
  const avatarUrl = mediaUrl(msg.user?.avatarUrl);
  const initial = (msg.name || 'K')[0].toUpperCase();
  if (avatarUrl) {
    return `<img class="chat-avatar-img" src="${escapeHtml(avatarUrl)}" alt="${initial}" onerror="this.outerHTML='<div class=chat-avatar>${initial}</div>'">`;
  }
  return `<div class="chat-avatar">${initial}</div>`;
}

function messagesHtml(msgs) {
  if (!msgs.length) return '<p class="admin-muted" style="text-align:center;padding:40px">Chưa có tin nhắn.</p>';
  return msgs.map(m => `
    <div class="admin-chat-msg" style="align-self:${m.isAdmin ? 'flex-end' : 'flex-start'}">
      <div class="chat-line ${m.isAdmin ? 'right' : ''}">
        ${m.isAdmin ? '' : avatarHtml(m)}
        <p class="chat-bubble ${m.isAdmin ? 'light' : 'dark'}">${escapeHtml(m.message)}</p>
        ${m.isAdmin ? avatarHtml(m) : ''}
      </div>
      <small style="font-size:10px;color:#999;display:block;margin-top:2px;text-align:${m.isAdmin?'right':'left'}">${formatDate(m.createdAt)}</small>
    </div>
  `).join('');
}

async function render() {
  root.innerHTML = `
    <div class="admin-page-head">
      <div><h1>Chat</h1><p>Hỗ trợ khách hàng.</p></div>
      <span class="admin-count">${conversationsData.length} hội thoại</span>
    </div>
    <div class="admin-chat-layout">
      <div class="admin-chat-sidebar" data-sidebar>${sidebarHtml()}</div>
      <div class="admin-chat-main">
        <div class="admin-chat-messages" data-msgs>${activeKey ? '<p class="admin-muted">Đang tải...</p>' : '<p class="admin-muted" style="text-align:center;padding:80px">← Chọn hội thoại bên trái</p>'}</div>
        ${activeKey ? `
          <form class="chat-send" data-reply>
            <input name="message" placeholder="Nhập trả lời..." autocomplete="off" required>
            <button type="submit">Gửi</button>
          </form>` : ''}
      </div>
    </div>`;

  if (activeKey) {
    const msgs = await loadMessages(activeKey);
    const el = root.querySelector('[data-msgs]');
    if (el) { el.innerHTML = messagesHtml(msgs); el.scrollTop = el.scrollHeight; }
    bindReply();
  }
}

function bindReply() {
  const form = document.querySelector('[data-reply]');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const inp = form.querySelector('input');
    const msg = inp.value.trim();
    if (!msg || !activeKey) return;
    const btn = form.querySelector('button');
    inp.disabled = btn.disabled = true;
    try {
      await apiFetch(`/admin/chat/${encodeURIComponent(activeKey)}`, {
        method: 'POST', body: JSON.stringify({ message: msg }),
      });
      inp.value = '';
      const msgs = await loadMessages(activeKey);
      const el = root.querySelector('[data-msgs]');
      if (el) { el.innerHTML = messagesHtml(msgs); el.scrollTop = el.scrollHeight; }
      await loadConversations();
      const sb = root.querySelector('[data-sidebar]');
      if (sb) sb.innerHTML = sidebarHtml();
    } catch (_) {} finally { inp.disabled = btn.disabled = false; inp.focus(); }
  });
}

root?.addEventListener('click', async e => {
  const btn = e.target.closest('[data-key]');
  if (btn) { activeKey = btn.dataset.key; await render(); }
});

async function poll() {
  stopPoll();
  await loadConversations();
  const sb = root?.querySelector('[data-sidebar]');
  if (sb) sb.innerHTML = sidebarHtml();
  if (activeKey) {
    const msgs = await loadMessages(activeKey);
    const el = root?.querySelector('[data-msgs]');
    if (el) { el.innerHTML = messagesHtml(msgs); el.scrollTop = el.scrollHeight; }
  }
  pollTimer = setTimeout(poll, 10000);
}

(async () => {
  await loadConversations();
  await render();
  poll();
})();
