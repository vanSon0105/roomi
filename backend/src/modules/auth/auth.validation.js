const { z } = require('zod');

const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(255).toLowerCase(),
      phone: z.string().trim().min(8).max(20).optional(),
      password: z.string().min(6).max(72),
      confirmPassword: z.string().min(6).max(72),
    })
    .refine((body) => body.password === body.confirmPassword, {
      message: 'Password confirmation does not match',
      path: ['confirmPassword'],
    }),
});

const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(1)
      .max(255)
      .transform((value) => (value.includes('@') ? value.toLowerCase() : value)),
    password: z.string().min(1).max(72),
  }),
});

const pageAccessSchema = z.object({
  query: z.object({
    path: z.string().trim().min(1).max(120),
  }),
});

module.exports = {
  loginSchema,
  pageAccessSchema,
  registerSchema,
};
