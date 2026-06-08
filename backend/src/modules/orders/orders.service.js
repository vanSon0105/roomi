const crypto = require('crypto');

const config = require('../../config/env');
const AppError = require('../../utils/app-error');
const ordersRepository = require('./orders.repository');
const { serializeOrder } = require('./orders.presenter');

const toNumber = (value) => Number(value || 0);
const toMoney = (value) => Number(value).toFixed(2);

const generateOrderCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `RM${timestamp}${random}`;
};

const buildOrderNote = ({ paymentCode, email, note }) =>
  [
    `Payment code: ${paymentCode}`,
    email ? `Customer email: ${email}` : '',
    note ? `Customer note: ${note}` : '',
  ]
    .filter(Boolean)
    .join('\n');

const createOrder = async (userId, payload) => {
  const order = await ordersRepository.transaction(async (tx) => {
    const cart = await ordersRepository.findCartForCheckout(userId, tx);

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    const selectedCartItemIds = Array.isArray(payload.cartItemIds)
      ? new Set(payload.cartItemIds.map(Number))
      : null;
    const checkoutItems = selectedCartItemIds
      ? cart.items.filter((item) => selectedCartItemIds.has(item.id))
      : cart.items;

    if (checkoutItems.length === 0) {
      throw new AppError('No selected cart items found', 400);
    }

    const unavailableItem = checkoutItems.find(
      (item) => item.product.status !== 'ACTIVE' || item.product.stock < item.quantity,
    );

    if (unavailableItem) {
      throw new AppError(`Product ${unavailableItem.product.name} is not available`, 409);
    }

    const orderCode = generateOrderCode();
    const subtotal = checkoutItems.reduce(
      (sum, item) => sum + toNumber(item.product.price) * item.quantity,
      0,
    );
    const shippingFee = config.checkoutShippingFee;
    const discountAmount = 0;
    const total = subtotal + shippingFee - discountAmount;

    const savedOrder = await ordersRepository.create(
      {
        code: orderCode,
        userId,
        recipientName: payload.name,
        recipientPhone: payload.phone,
        shippingLine1: payload.address,
        shippingCountry: 'Viet Nam',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'BANK_TRANSFER',
        subtotal: toMoney(subtotal),
        shippingFee: toMoney(shippingFee),
        discountAmount: toMoney(discountAmount),
        total: toMoney(total),
        note: buildOrderNote({
          paymentCode: orderCode,
          email: payload.email,
          note: payload.note,
        }),
        items: {
          create: checkoutItems.map((item) => {
            const unitPrice = toNumber(item.product.price);
            const totalPrice = unitPrice * item.quantity;

            return {
              productId: item.productId,
              productName: item.product.name,
              productSku: item.product.sku,
              unitPrice: toMoney(unitPrice),
              quantity: item.quantity,
              totalPrice: toMoney(totalPrice),
            };
          }),
        },
      },
      tx,
    );

    return savedOrder;
  });

  return serializeOrder(order);
};

const getOrder = async (userId, code) => {
  const order = await ordersRepository.findByCodeForUser({ userId, code });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return serializeOrder(order);
};

const removeReportedOrderItemsFromCart = async ({ userId, orderItems, tx }) => {
  const cart = await ordersRepository.findCartForCheckout(userId, tx);

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
      await ordersRepository.updateCartItemQuantity(
        {
          itemId: cartItem.id,
          quantity: nextQuantity,
        },
        tx,
      );
    } else {
      await ordersRepository.deleteCartItem(cartItem.id, tx);
    }
  }
};

const reportPaid = async (userId, code) => {
  const order = await ordersRepository.transaction(async (tx) => {
    const existingOrder = await ordersRepository.findByCodeForUser({ userId, code }, tx);

    if (!existingOrder) {
      throw new AppError('Order not found', 404);
    }

    if (existingOrder.paymentMethod !== 'BANK_TRANSFER') {
      throw new AppError('This order does not use bank transfer payment', 400);
    }

    if (existingOrder.paymentReportedAt || existingOrder.paymentStatus === 'PAID') {
      return existingOrder;
    }

    await removeReportedOrderItemsFromCart({
      userId,
      orderItems: existingOrder.items,
      tx,
    });

    return ordersRepository.updatePaymentReportedAt(
      {
        orderId: existingOrder.id,
        paymentReportedAt: new Date(),
      },
      tx,
    );
  });

  return serializeOrder(order);
};

module.exports = {
  createOrder,
  getOrder,
  reportPaid,
};
