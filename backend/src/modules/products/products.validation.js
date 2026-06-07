const { z } = require('zod');

const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(30),
    category: z.string().trim().max(120).optional(),
    search: z.string().trim().max(255).optional(),
    featured: z
      .enum(['true', 'false'])
      .optional()
      .transform((value) => (value == null ? undefined : value === 'true')),
  }),
});

const productSlugParamSchema = z.object({
  params: z.object({
    slug: z.string().trim().min(1).max(180),
  }),
});

const relatedProductsSchema = productSlugParamSchema.extend({
  query: z.object({
    limit: z.coerce.number().int().positive().max(12).default(3),
  }),
});

module.exports = {
  listProductsSchema,
  productSlugParamSchema,
  relatedProductsSchema,
};
