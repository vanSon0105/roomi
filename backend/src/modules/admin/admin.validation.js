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

const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(180),
    slug: z.string().trim().min(2).max(200).optional(),
    categoryId: z.coerce.number().int().positive().nullable().optional(),
    price: z.coerce.number().nonnegative(),
    compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),
    stock: z.coerce.number().int().nonnegative().default(0),
    sku: z.string().trim().max(80).nullable().optional(),
    shortDescription: z.string().trim().max(500).nullable().optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    status: z.enum(productStatuses).default('DRAFT'),
    isFeatured: z.boolean().default(false),
  }),
});

const updateProductSchema = productIdParamSchema.extend({
  body: z
    .object({
      name: z.string().trim().min(2).max(180).optional(),
      slug: z.string().trim().min(2).max(200).optional(),
      categoryId: z.coerce.number().int().positive().nullable().optional(),
      sku: z.string().trim().max(80).nullable().optional(),
      price: z.coerce.number().nonnegative().optional(),
      compareAtPrice: z.coerce.number().nonnegative().nullable().optional(),
      stock: z.coerce.number().int().nonnegative().optional(),
      shortDescription: z.string().trim().max(500).nullable().optional(),
      description: z.string().trim().max(10000).nullable().optional(),
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
      isBanned: z.boolean().optional(),
      name: z.string().trim().min(2).max(100).optional(),
      phone: z.string().trim().min(8).max(20).nullable().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

module.exports = {
  createProductSchema,
  listOrdersSchema,
  listProductsSchema,
  listUsersSchema,
  orderCodeParamSchema,
  productIdParamSchema,
  updateOrderSchema,
  updateProductSchema,
  updateUserSchema,
};
