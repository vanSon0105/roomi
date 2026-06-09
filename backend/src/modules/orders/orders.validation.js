const { z } = require('zod');

const createOrderSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(8).max(20),
    email: z.string().trim().email().max(160).optional().or(z.literal('')),
    address: z.string().trim().min(5).max(300),
    note: z.string().trim().max(1000).optional().or(z.literal('')),
    paymentMethod: z.enum(['BANK_TRANSFER', 'COD']).default('BANK_TRANSFER'),
    cartItemIds: z.array(z.coerce.number().int().positive()).min(1).max(100).optional(),
  }),
});

const orderCodeParamSchema = z.object({
  params: z.object({
    code: z.string().trim().min(4).max(30).regex(/^[A-Za-z0-9_-]+$/),
  }),
});

module.exports = {
  createOrderSchema,
  orderCodeParamSchema,
};
