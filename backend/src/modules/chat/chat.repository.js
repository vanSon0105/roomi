const prisma = require('../../config/prisma');

const withClient = (client) => client || prisma;

const messageInclude = {
  user: { select: { avatarUrl: true } },
};

const findMessages = ({ userId, guestId }, client) => {
  const where = {};
  if (userId) {
    where.userId = userId;
  } else if (guestId) {
    where.guestId = guestId;
    where.userId = null;
  } else {
    return [];
  }
  return withClient(client).chatMessage.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: messageInclude,
  });
};

const findAdminMessages = ({ userId, guestId }, client) =>
  withClient(client).chatMessage.findMany({
    where: userId
      ? { userId }
      : { guestId, userId: null },
    orderBy: { createdAt: 'asc' },
    include: messageInclude,
  });

const findAllConversations = async (client) => {
  const db = withClient(client);
  // Get latest message per user/guest
  const messages = await db.chatMessage.findMany({
    where: { isAdmin: false },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      userId: true,
      guestId: true,
      name: true,
      message: true,
      createdAt: true,
      isRead: true,
    },
  });

  // Dedupe by key (userId or guestId), keep latest
  const seen = new Set();
  const conversations = [];
  for (const m of messages) {
    const key = m.userId ? `user-${m.userId}` : `guest-${m.guestId}`;
    if (!seen.has(key)) {
      seen.add(key);
      conversations.push({
        ...m,
        key,
        lastMessage: m.message,
        lastMessageAt: m.createdAt,
      });
    }
  }
  return conversations;
};

const findUnreadCount = async (client) => {
  const grouped = await withClient(client).chatMessage.groupBy({
    by: ['userId', 'guestId'],
    where: { isAdmin: false, isRead: false },
    _count: { id: true },
  });
  return grouped.reduce((sum, g) => sum + g._count.id, 0);
};

const create = (data, client) =>
  withClient(client).chatMessage.create({ data });

const markRead = ({ userId, guestId }, client) => {
  const where = { isAdmin: false, isRead: false };
  if (userId) {
    where.userId = userId;
  } else if (guestId) {
    where.guestId = guestId;
    where.userId = null;
  }
  return withClient(client).chatMessage.updateMany({
    where,
    data: { isRead: true },
  });
};

module.exports = {
  create,
  findAllConversations,
  findAdminMessages,
  findMessages,
  findUnreadCount,
  markRead,
};
