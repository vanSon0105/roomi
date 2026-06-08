const prisma = require('../../config/prisma');

const orderInclude = {
  items: {
    orderBy: { id: 'asc' },
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

module.exports = {
  clearCart,
  create,
  deleteCartItem,
  findByCodeForUser,
  findCartForCheckout,
  transaction,
  updateCartItemQuantity,
  updatePaymentReportedAt,
};
