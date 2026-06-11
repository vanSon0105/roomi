process.env.DATABASE_URL ||= 'mysql://root:password@localhost:3306/roomi_test';
process.env.JWT_SECRET ||= 'test-secret';
process.env.NODE_ENV ||= 'test';
process.env.SEPAY_ACCOUNT_NO ||= '123456789';
process.env.SEPAY_QR_BANK_NAME ||= 'VietinBank';

const assert = require('node:assert/strict');
const test = require('node:test');

test('auth token round-trips user identity', () => {
  const { signToken, verifyToken, serializeAuthCookie } = require('../src/modules/auth/auth-token');

  const token = signToken({
    id: 7,
    email: 'admin@example.com',
    role: 'ADMIN',
  });
  const user = verifyToken(token);
  const cookie = serializeAuthCookie(token);

  assert.equal(user.id, 7);
  assert.equal(user.email, 'admin@example.com');
  assert.equal(user.role, 'ADMIN');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
});

test('express app loads with security defaults', () => {
  const app = require('../src/app');

  assert.equal(app.enabled('x-powered-by'), false);
});

test('public order serialization omits private order details', () => {
  const { serializePublicOrder } = require('../src/modules/orders/orders.presenter');
  const now = new Date('2026-06-11T00:00:00.000Z');

  const order = serializePublicOrder({
    id: 1,
    code: 'RMTEST123456',
    orderType: 'PRODUCT',
    recipientName: 'Private Name',
    recipientPhone: '0999999999',
    shippingLine1: 'Private address',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'SEPAY',
    subtotal: '100000.00',
    shippingFee: '30000.00',
    discountAmount: '0.00',
    total: '130000.00',
    note: 'private note',
    items: [
      {
        id: 1,
        productId: 1,
        productName: 'Private item',
        productSku: 'SKU',
        unitPrice: '100000.00',
        quantity: 1,
        totalPrice: '100000.00',
      },
    ],
    paymentTransactions: [],
    paymentReportedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  assert.equal(order.code, 'RMTEST123456');
  assert.equal(order.total, 130000);
  assert.equal(order.payment.provider, 'SEPAY');
  assert.equal(Object.hasOwn(order, 'recipientName'), false);
  assert.equal(Object.hasOwn(order, 'recipientPhone'), false);
  assert.equal(Object.hasOwn(order, 'shippingLine1'), false);
  assert.equal(Object.hasOwn(order, 'items'), false);
  assert.equal(Object.hasOwn(order, 'note'), false);
});

test('admin order validation accepts cancelled payment status', () => {
  const { listOrdersSchema, updateOrderSchema } = require('../src/modules/admin/admin.validation');

  assert.doesNotThrow(() =>
    listOrdersSchema.parse({
      query: {
        paymentStatus: 'CANCELLED',
      },
    }),
  );

  assert.doesNotThrow(() =>
    updateOrderSchema.parse({
      params: {
        code: 'RMTEST123456',
      },
      body: {
        paymentStatus: 'CANCELLED',
      },
    }),
  );
});

test('sepay webhook rejects requests when webhook API key is not configured', async () => {
  const config = require('../src/config/env');
  const paymentsService = require('../src/modules/payments/payments.service');
  const previousKey = config.sepay.webhookApiKey;

  config.sepay.webhookApiKey = '';

  try {
    await assert.rejects(
      () =>
        paymentsService.handleSepayWebhook({
          payload: {
            code: 'SEVQR RMTEST123456',
            transferAmount: 130000,
            transferType: 'in',
          },
          headers: {},
        }),
      (error) => error.statusCode === 503,
    );
  } finally {
    config.sepay.webhookApiKey = previousKey;
  }
});
