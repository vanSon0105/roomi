const { z } = require('zod');

const addCartItemSchema = z.object({
  body: z
    .object({
      productId: z.coerce.number().int().positive().optional(),
      productSlug: z.string().trim().min(1).max(180).optional(),
      quantity: z.coerce.number().int().positive().max(99).default(1),
    })
    .refine((body) => body.productId || body.productSlug, {
      message: 'productId or productSlug is required',
      path: ['productSlug'],
    }),
});

const cartItemParamSchema = z.object({
  params: z.object({
    itemId: z.coerce.number().int().positive(),
  }),
});

const updateCartItemSchema = cartItemParamSchema.extend({
  body: z.object({
    quantity: z.coerce.number().int().min(0).max(99),
  }),
});

module.exports = {
  addCartItemSchema,
  cartItemParamSchema,
  updateCartItemSchema,
};
