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

const removeOrderItemsFromCart = async ({ userId, orderItems, tx }) => {
  const cart = await findCartForCheckout(userId, tx);

  if (!cart || cart.items.length === 0) {
    return;
  }

  for (const orderItem of orderItems) {
    if (!orderItem.productId) {
      continue;
    }

    const cartItem = cart.items.find((item) => item.productId === orderItem.productId);

    if (!cartItem) {
      continue;
    }

    const nextQuantity = cartItem.quantity - orderItem.quantity;

    if (nextQuantity > 0) {
      await updateCartItemQuantity({ itemId: cartItem.id, quantity: nextQuantity }, tx);
    } else {
      await deleteCartItem(cartItem.id, tx);
    }
  }
};

module.exports = {
  clearCart,
  create,
  deleteCartItem,
  findById,
  findByCode,
  findByCodeForUser,
  findCartForCheckout,
  removeOrderItemsFromCart,
  transaction,
  updateCartItemQuantity,
  updatePaymentMethod,
  updatePaymentReportedAt,
};
