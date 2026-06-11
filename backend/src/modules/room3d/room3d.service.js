const crypto = require('crypto');

const prisma = require('../../config/prisma');
const AppError = require('../../utils/app-error');
const ordersRepository = require('../orders/orders.repository');
const { serializeOrder } = require('../orders/orders.presenter');
const paymentsService = require('../payments/payments.service');
const settingsRepository = require('../settings/settings.repository');
const settingsService = require('../settings/settings.service');
const room3dRepository = require('./room3d.repository');

const ROOM3D_PRICE_KEY = 'room3d_price';
const ROOM3D_ITEM_NAME = 'Quyền xem mô phỏng 3D ROOMI';
const PENDING_ORDER_TTL_MS = 15 * 60 * 1000;

const toNumber = (value) => Number(value || 0);
const toMoney = (value) => Number(value || 0).toFixed(2);

const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `RM${timestamp}${random}`;
};

const normalizePrice = (value) => {
  const price = Math.round(Number(value || 0));
  return Number.isFinite(price) && price > 0 ? price : 0;
};

const getRoom3DPrice = async () => {
  const rawPrice = await settingsService.getSetting(ROOM3D_PRICE_KEY, '0');
  return normalizePrice(rawPrice);
};

const normalizeAccessPaymentMethod = (provider) => (provider === 'BANK_TRANSFER' ? 'SEPAY' : provider || 'SEPAY');

const findPendingOrder = async (userId, paymentMethod = null, price = null) => {
  const where = {
    userId,
    orderType: 'ROOM3D_ACCESS',
    paymentStatus: 'UNPAID',
    status: {
      not: 'CANCELLED',
    },
  };

  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  if (price != null) {
    where.total = toMoney(price);
  }

  const order = await prisma.order.findFirst({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      items: { orderBy: { id: 'asc' } },
      paymentTransactions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!order) return null;

  // Exclude if latest payment transaction is terminal
  const latestTx = order.paymentTransactions?.[0];
  if (latestTx && ['CANCELLED', 'EXPIRED', 'FAILED'].includes(latestTx.status)) {
    return null;
  }

  // Avoid reusing stale payment links, but keep enough time for real payment flows.
  const ageMs = Date.now() - new Date(order.createdAt).getTime();
  if (ageMs > PENDING_ORDER_TTL_MS) {
    return null;
  }

  return order;
};

const userHasPaidAccess = async (userId) => {
  const access = await room3dRepository.findAccessForUser(userId);

  if (!access) {
    return false;
  }

  if (!access.expiresAt) {
    return true;
  }

  return new Date(access.expiresAt).getTime() > Date.now();
};

const serializeAccessStatus = ({ price, hasAccess, pendingOrder = null } = {}) => ({
  price,
  hasAccess: Boolean(hasAccess),
  paymentRequired: price > 0 && !hasAccess,
  pendingOrder: pendingOrder ? serializeOrder(pendingOrder) : null,
});

const getAccessStatus = async (userId) => {
  const price = await getRoom3DPrice();

  if (price <= 0) {
    return serializeAccessStatus({ price, hasAccess: true });
  }

  const hasAccess = await userHasPaidAccess(userId);
  const paymentMethod = normalizeAccessPaymentMethod(await settingsService.getTransferProvider());
  const pendingOrder = hasAccess ? null : await findPendingOrder(userId, paymentMethod, price);

  return serializeAccessStatus({
    price,
    hasAccess,
    pendingOrder,
  });
};

const createAccessOrder = async (userId, forceNew = false) => {
  const price = await getRoom3DPrice();

  if (price <= 0) {
    return serializeAccessStatus({ price, hasAccess: true });
  }

  const hasAccess = await userHasPaidAccess(userId);
  if (hasAccess) {
    return serializeAccessStatus({ price, hasAccess: true });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const paymentMethod = normalizeAccessPaymentMethod(await settingsService.getTransferProvider());

  if (paymentMethod === 'PAYOS' && !paymentsService.isPayosConfigured()) {
    throw new AppError('payOS is not configured', 400);
  }

  const pendingOrder = forceNew ? null : await findPendingOrder(userId, paymentMethod, price);
  if (pendingOrder) {
    return serializeAccessStatus({ price, hasAccess: false, pendingOrder });
  }

  const orderCode = generateOrderCode();
  const savedOrder = await ordersRepository.create({
    code: orderCode,
    orderType: 'ROOM3D_ACCESS',
    userId,
    recipientName: user.name || 'ROOMI customer',
    recipientPhone: user.phone || '0000000000',
    shippingLine1: 'Mở khóa mô phỏng 3D ROOMI',
    shippingCountry: 'Viet Nam',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod,
    subtotal: toMoney(price),
    shippingFee: toMoney(0),
    discountAmount: toMoney(0),
    total: toMoney(price),
    note: [
      `Payment code: ${orderCode}`,
      'Service: ROOMI 3D access',
      user.email ? `Customer email: ${user.email}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    items: {
      create: [
        {
          productId: null,
          productName: ROOM3D_ITEM_NAME,
          productSku: 'ROOMI-3D-ACCESS',
          unitPrice: toMoney(price),
          quantity: 1,
          totalPrice: toMoney(price),
        },
      ],
    },
  });

  const payableOrder =
    savedOrder.paymentMethod === 'PAYOS'
      ? await paymentsService.createPayosPaymentForOrder(savedOrder)
      : savedOrder;

  return serializeAccessStatus({
    price,
    hasAccess: false,
    pendingOrder: payableOrder,
  });
};

const getAdminRoom3D = async () => {
  const [price, accessCount, latest] = await Promise.all([
    getRoom3DPrice(),
    room3dRepository.countAccesses(),
    room3dRepository.latestAccesses(8),
  ]);

  return {
    price,
    accessCount,
    latestAccesses: latest.map((item) => ({
      id: item.id,
      grantedAt: item.grantedAt,
      expiresAt: item.expiresAt,
      pricePaid: toNumber(item.pricePaid),
      user: item.user,
      order: item.order
        ? {
            ...item.order,
            total: toNumber(item.order.total),
          }
        : null,
    })),
  };
};

const updateAdminRoom3D = async ({ price }) => {
  const normalizedPrice = normalizePrice(price);
  await settingsRepository.upsert(ROOM3D_PRICE_KEY, String(normalizedPrice));
  return getAdminRoom3D();
};

const cancelAccessOrder = async (userId) => {
  const order = await findPendingOrder(userId);
  if (!order) return null;

  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED', paymentStatus: 'CANCELLED' },
  });

  return { cancelled: true };
};

module.exports = {
  cancelAccessOrder,
  createAccessOrder,
  getAccessStatus,
  getAdminRoom3D,
  getRoom3DPrice,
  updateAdminRoom3D,
};
