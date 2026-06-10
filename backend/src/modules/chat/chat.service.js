const chatRepository = require('./chat.repository');

const getMessages = async ({ userId, guestId }) => {
  return chatRepository.findMessages({ userId, guestId });
};

const sendMessage = async ({ userId, guestId, name, message }) => {
  return chatRepository.create({
    userId: userId || null,
    guestId: userId ? null : (guestId || null),
    name: name || 'Khách',
    message,
    isAdmin: false,
  });
};

const getConversations = async () => {
  const rows = await chatRepository.findAllConversations();
  const conversations = rows.map((row) => ({
    key: row.key || (row.userId ? `user-${row.userId}` : `guest-${row.guestId}`),
    userId: row.userId,
    guestId: row.guestId,
    userName: row.userId ? row.name : `Khách (${String(row.guestId || '').slice(0, 8)})`,
    lastMessage: (row.lastMessage || '').slice(0, 120),
    lastMessageAt: row.lastMessageAt,
    isRead: row.isRead,
  }));

  return { conversations };
};

const getConversation = async ({ userId, guestId }) => {
  const messages = await chatRepository.findAdminMessages({ userId, guestId });
  await chatRepository.markRead({ userId, guestId });
  return messages;
};

const adminReply = async ({ userId, guestId, message }) => {
  return chatRepository.create({
    userId: userId || null,
    guestId: userId ? null : (guestId || null),
    name: 'ROOMI',
    message,
    isAdmin: true,
  });
};

module.exports = {
  adminReply,
  getConversation,
  getConversations,
  getMessages,
  sendMessage,
};
