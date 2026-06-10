const { z } = require('zod');

const sendMessageSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    message: z.string().trim().min(1).max(2000),
  }),
});

const adminReplySchema = z.object({
  body: z.object({
    message: z.string().trim().min(1).max(2000),
  }),
});

module.exports = {
  sendMessageSchema,
  adminReplySchema,
};
