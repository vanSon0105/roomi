const prisma = require('../../config/prisma');

const orderInclude = {
  items: {
    orderBy: { id: 'asc' },
  },
  paymentTransactions: {
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
};

const cartForCheckoutInclude = {
  items: {
    orderBy: { id: 'asc' },
    include: {
      product: true,
    },
  },
};

const withClient = (client) => client || prisma;

const transaction = (callback) => prisma.$transaction(callback);

const findCartForCheckout = (userId, client) =>
  withClient(client).cart.findUnique({
    where: { userId },
    include: cartForCheckoutInclude,
  });

const create = (data, client) =>
  withClient(client).order.create({
    data,
    include: orderInclude,
  });

const findById = (id, client) =>
  withClient(client).order.findUnique({
    where: { id },
    include: orderInclude,
  });

const findByCode = (code, client) =>
  withClient(client).order.findUnique({
    where: { code },
    include: orderInclude,
  });

const clearCart = (cartId, client) =>
  withClient(client).cartItem.deleteMany({
    where: { cartId },
  });

const deleteCartItem = (itemId, client) =>
  withClient(client).cartItem.delete({
    where: { id: itemId },
  });

const findByCodeForUser = ({ code, userId }, client) =>
  withClient(client).order.findFirst({
    where: {
      code,
      userId,
    },
    include: orderInclude,
  });

const updateCartItemQuantity = ({ itemId, quantity }, client) =>
  withClient(client).cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

const updatePaymentReportedAt = ({ orderId, paymentReportedAt }, client) =>
  withClient(client).order.update({
    where: { id: orderId },
    data: { paymentReportedAt },
    include: orderInclude,
  });

const updatePaymentMethod = ({ orderId, paymentMethod, paymentStatus = 'UNPAID', paymentReportedAt = null }, client) =>
  withClient(client).order.update({
    where: { id: orderId },
    data: {
      paymentMethod,
      paymentStatus,
      paymentReportedAt,
    },
    include: orderInclude,
  });

module.exports = {
  clearCart,
  create,
  deleteCartItem,
  findById,
  findByCode,
  findByCodeForUser,
  findCartForCheckout,
  transaction,
  updateCartItemQuantity,
  updatePaymentMethod,
  updatePaymentReportedAt,
};
