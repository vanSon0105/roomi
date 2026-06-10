const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const chatService = require('./chat.service');

// Resolve identity from auth or guestId query param
const identity = (req) => ({
  userId: req.user?.id || null,
  guestId: req.user?.id ? null : (req.query.guestId || null),
  name: req.user?.name || req.validated?.body?.name || 'Khách',
});

// Customer: get my messages
const getMessages = asyncHandler(async (req, res) => {
  const data = await chatService.getMessages(identity(req));

  sendSuccess(res, {
    message: 'Messages fetched',
    data,
  });
});

// Customer: send message
const sendMessage = asyncHandler(async (req, res) => {
  const id = identity(req);
  const data = await chatService.sendMessage({
    userId: id.userId,
    guestId: id.guestId,
    name: id.name,
    message: req.validated.body.message,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Message sent',
    data,
  });
});

// Admin: list all conversations
const getConversations = asyncHandler(async (_req, res) => {
  const data = await chatService.getConversations();

  sendSuccess(res, {
    message: 'Conversations fetched',
    data,
  });
});

// Admin: get conversation
const getConversation = asyncHandler(async (req, res) => {
  const data = await chatService.getConversation({
    userId: req.params.key?.startsWith('user-') ? Number(req.params.key.slice(5)) : null,
    guestId: req.params.key?.startsWith('guest-') ? req.params.key.slice(6) : null,
  });

  sendSuccess(res, {
    message: 'Conversation fetched',
    data,
  });
});

// Admin: reply
const adminReply = asyncHandler(async (req, res) => {
  const data = await chatService.adminReply({
    userId: req.params.key?.startsWith('user-') ? Number(req.params.key.slice(5)) : null,
    guestId: req.params.key?.startsWith('guest-') ? req.params.key.slice(6) : null,
    message: req.validated.body.message,
  });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Reply sent',
    data,
  });
});

// Admin: unread count only (lightweight for polling)
const getUnreadCount = asyncHandler(async (_req, res) => {
  const chatRepository = require('./chat.repository');
  const count = await chatRepository.findUnreadCount();

  sendSuccess(res, {
    message: 'Unread count fetched',
    data: { count },
  });
});

module.exports = {
  adminReply,
  getConversation,
  getConversations,
  getMessages,
  getUnreadCount,
  sendMessage,
};
