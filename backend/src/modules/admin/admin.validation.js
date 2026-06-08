const { z } = require('zod');

const orderStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const paymentStatuses = ['UNPAID', 'PAID', 'REFUNDED'];
const productStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
const roles = ['USER', 'ADMIN'];

const paginationQuery = {
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(255).optional(),
};

const listOrdersSchema = z.object({
  query: z.object({
    ...paginationQuery,
    status: z.enum(orderStatuses).optional(),
    paymentStatus: z.enum(paymentStatuses).optional(),
  }),
});

const orderCodeParamSchema = z.object({
  params: z.object({
    code: z.string().trim().min(1).max(80),
  }),
});

const updateOrderSchema = orderCodeParamSchema.extend({
  body: z
    .object({
      status: z.enum(orderStatuses).optional(),
      paymentStatus: z.enum(paymentStatuses).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

const listProductsSchema = z.object({
  query: z.object({
    ...paginationQuery,
    status: z.enum(['ALL', ...productStatuses]).default('ALL'),
  }),
});

const productIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

const updateProductSchema = productIdParamSchema.extend({
  body: z
    .object({
      name: z.string().trim().min(2).max(180).optional(),
      sku: z.string().trim().max(80).nullable().optional(),
      price: z.coerce.number().nonnegative().optional(),
      compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),
      stock: z.coerce.number().int().nonnegative().optional(),
      status: z.enum(productStatuses).optional(),
      isFeatured: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

const listUsersSchema = z.object({
  query: z.object({
    ...paginationQuery,
    role: z.enum(['ALL', ...roles]).default('ALL'),
  }),
});

const userIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

const updateUserSchema = userIdParamSchema.extend({
  body: z
    .object({
      role: z.enum(roles).optional(),
      name: z.string().trim().min(2).max(100).optional(),
      phone: z.string().trim().min(8).max(20).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

module.exports = {
  listOrdersSchema,
  listProductsSchema,
  listUsersSchema,
  orderCodeParamSchema,
  updateOrderSchema,
  updateProductSchema,
  updateUserSchema,
};
