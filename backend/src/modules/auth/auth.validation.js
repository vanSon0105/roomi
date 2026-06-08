const { z } = require('zod');

const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Tên đăng nhập phải có ít nhất 2 ký tự')
        .max(100, 'Tên đăng nhập tối đa 100 ký tự'),
      email: z
        .string()
        .trim()
        .email('Email không đúng định dạng')
        .max(255, 'Email tối đa 255 ký tự')
        .toLowerCase(),
      phone: z
        .string()
        .trim()
        .min(8, 'Số điện thoại phải có ít nhất 8 ký tự')
        .max(20, 'Số điện thoại tối đa 20 ký tự')
        .optional(),
      password: z
        .string()
        .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
        .max(72, 'Mật khẩu tối đa 72 ký tự'),
      confirmPassword: z
        .string()
        .min(6, 'Mật khẩu nhập lại phải có ít nhất 6 ký tự')
        .max(72, 'Mật khẩu nhập lại tối đa 72 ký tự'),
    })
    .refine((body) => body.password === body.confirmPassword, {
      message: 'Mật khẩu nhập lại không khớp',
      path: ['confirmPassword'],
    }),
});

const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên đăng nhập hoặc email')
      .max(255, 'Tên đăng nhập/email tối đa 255 ký tự')
      .transform((value) => (value.includes('@') ? value.toLowerCase() : value)),
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu')
      .max(72, 'Mật khẩu tối đa 72 ký tự'),
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
