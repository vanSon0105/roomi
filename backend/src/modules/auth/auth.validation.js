const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(255).toLowerCase(),
    password: z.string().min(6).max(72),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(255).toLowerCase(),
    password: z.string().min(1).max(72),
  }),
});

module.exports = {
  loginSchema,
  registerSchema,
};
