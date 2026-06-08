const { z } = require('zod');

const emptyToNull = (value) => (value === '' ? null : value);

const userIdParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().trim().max(255).optional(),
  }),
});

const updateUserSchema = userIdParamSchema.extend({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      email: z.string().trim().email().max(255).toLowerCase().optional(),
      phone: z.preprocess(emptyToNull, z.string().trim().min(8).max(20).nullable().optional()),
      avatarUrl: z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional()),
      birthday: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
      password: z.string().min(6).max(72).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

const updateCurrentUserSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      phone: z.preprocess(emptyToNull, z.string().trim().min(8).max(20).nullable().optional()),
      birthday: z.preprocess(emptyToNull, z.coerce.date().nullable().optional()),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field is required',
    }),
});

module.exports = {
  listUsersSchema,
  updateCurrentUserSchema,
  updateUserSchema,
  userIdParamSchema,
};
