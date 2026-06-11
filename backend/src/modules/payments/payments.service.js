const { PayOS } = require('@payos/node');

const prisma = require('../../config/prisma');
const config = require('../../config/env');
const AppError = require('../../utils/app-error');
const ordersRepository = require('../orders/orders.repository');
const paymentsRepository = require('./payments.repository');
const room3dRepository = require('../room3d/room3d.repository');

const toNumber = (value) => (value == null ? 0 : Number(value));
const toMoney = (value) => Number(value).toFixed(2);

let payosClient = null;
let payosClientSignature = null;

const isPayosConfigured = () =>
  Boolean(config.payos.clientId && config.payos.apiKey && config.payos.checksumKey);

const hasVietQrConfig = () =>
  Boolean(config.vietqr.bankId && config.vietqr.accountNo && config.vietqr.accountName);

const getPayosClient = () => {
  if (!isPayosConfigured()) {
    throw new AppError('payOS is not configured', 400);
  }

  const signature = [
    config.payos.clientId,
    config.payos.apiKey,
    config.payos.checksumKey,
    config.payos.partnerCode,
  ].join('|');

  if (!payosClient || payosClientSignature !== signature) {
    payosClient = new PayOS({
      clientId: config.payos.clientId,
      apiKey: config.payos.apiKey,
      checksumKey: config.payos.checksumKey,
      partnerCode: config.payos.partnerCode || undefined,
    });
    payosClientSignature = signature;
  }

  return payosClient;
};

const resetPayosClient = () => {
  payosClient = null;
  payosClientSignature = null;
};

const appendQuery = (url, params) => {
  const result = new URL(url);

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      result.searchParams.set(key, value);
    }
  });

  return result.toString();
};

const payosUrls = (order = '') => {
  const orderCode = typeof order === 'string' ? order : order?.code || '';
  const isRoom3DAccess = typeof order === 'object' && order?.orderType === 'ROOM3D_ACCESS';
  const baseReturnUrl = isRoom3DAccess
    ? `${config.appBaseUrl}/pages/room-3d.html`
    : config.payos.returnUrl || `${config.appBaseUrl}/pages/checkout-success.html`;
  const baseCancelUrl = isRoom3DAccess
    ? `${config.appBaseUrl}/pages/room-3d.html`
    : config.payos.cancelUrl || `${config.appBaseUrl}/pages/checkout.html`;

  return {
    webhookUrl: config.payos.webhookUrl || `${config.appBaseUrl}/api/payments/payos/webhook`,
    returnUrl: appendQuery(baseReturnUrl, {
      ref: orderCode,
      provider: 'payos',
    }),
    cancelUrl: appendQuery(baseCancelUrl, {
      payment: 'cancelled',
      ref: orderCode,
      provider: 'payos',
    }),
  };
};

const safeJson = (value) => {
  try {
    return JSON.stringify(value);
  } catch (_error) {
    return null;
  }
};

const generateProviderOrderCode = (orderId) => {
  const suffix = String(orderId % 1000).padStart(3, '0');
  return BigInt(`${Date.now()}${suffix}`);
};

const payosDescription = (orderCode) => `ROOMI ${String(orderCode).slice(0, 18)}`;

const payosItems = (order) =>
  (order.items || []).slice(0, 20).map((item) => ({
    name: String(item.productName || 'ROOMI item').slice(0, 120),
    quantity: item.quantity,
    price: Math.round(toNumber(item.unitPrice)),
  }));

const mapPayosStatus = (status) => {
  const normalized = String(status || '').toUpperCase();
  const allowed = ['PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'FAILED', 'PROCESSING', 'UNDERPAID'];
  return allowed.includes(normalized) ? normalized : 'PENDING';
};

const sepayUrls = () => ({
  webhookUrl: config.sepay.webhookUrl || `${config.appBaseUrl}/api/payments/sepay/webhook`,
});

const normalizeHeaderValue = (value = '') =>
  String(Array.isArray(value) ? value[0] : value)
    .trim()
    .replace(/\s+/g, ' ');

const verifySepayWebhookAuth = (headers = {}) => {
  if (!config.sepay.webhookApiKey) {
    throw new AppError('SePay webhook API key is not configured', 503);
  }

  const authorization = normalizeHeaderValue(headers.authorization || headers.Authorization);
  const expected = `Apikey ${config.sepay.webhookApiKey}`;
  const bearerExpected = `Bearer ${config.sepay.webhookApiKey}`;

  if (authorization !== expected && authorization !== bearerExpected) {
    throw new AppError('Invalid SePay webhook API key', 401);
  }
};

const firstTruthy = (...values) => values.find((value) => value != null && value !== '');

const sepayWebhookId = (payload = {}) => {
  const rawId = firstTruthy(payload.id, payload.transactionId, payload.referenceCode, payload.reference);
  return rawId == null ? null : String(rawId).trim();
};

const sepayProviderPaymentId = (payload = {}) => {
  const id = sepayWebhookId(payload);
  return id ? `SEPAY:${id}` : null;
};

const sepayProviderOrderCode = (payload = {}) => {
  const rawId = firstTruthy(payload.id, payload.transactionId);
  if (rawId == null || rawId === '') {
    return null;
  }

  const numeric = Number(rawId);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }

  return BigInt(Math.trunc(numeric));
};

const sepayTransferAmount = (payload = {}) =>
  toNumber(firstTruthy(payload.transferAmount, payload.amount, payload.money, payload.value));

const sepayTransferType = (payload = {}) =>
  String(firstTruthy(payload.transferType, payload.type, payload.transactionType) || '').trim().toLowerCase();

const sepayTransferContent = (payload = {}) =>
  [
    payload.code,
    payload.content,
    payload.description,
    payload.referenceCode,
    payload.reference,
  ]
    .filter(Boolean)
    .join(' ');

const extractOrderCodeFromSepay = (payload = {}) => {
  const directCode = String(payload.code || '').trim();
  // SEVQR prefix + order code: "SEVQR RMXXXXX..."
  const sevqrMatch = directCode.match(/\bRM[A-Z0-9_-]{6,40}\b/i);
  if (sevqrMatch) {
    return sevqrMatch[0].toUpperCase();
  }

  const content = sepayTransferContent(payload);
  // Try SEVQR-prefixed content first
  const sevqrContentMatch = content.match(/SEVQR\s+(RM[A-Z0-9_-]{6,40})\b/i);
  if (sevqrContentMatch) {
    return sevqrContentMatch[1].toUpperCase();
  }
  // Fallback: any RM code in content
  const match = content.match(/\bRM[A-Z0-9_-]{6,40}\b/i);
  return match ? match[0].toUpperCase() : null;
};

const removeOrderItemsFromCart = ordersRepository.removeOrderItemsFromCart;

const createPayosPaymentForOrder = async (order) => {
  const client = getPayosClient();
  const providerOrderCode = generateProviderOrderCode(order.id);
  const amount = Math.round(toNumber(order.total));
  const urls = payosUrls(order);
  const requestPayload = {
    orderCode: Number(providerOrderCode),
    amount,
    description: payosDescription(order.code),
    returnUrl: urls.returnUrl,
    cancelUrl: urls.cancelUrl,
    items: payosItems(order),
    buyerName: order.recipientName,
    buyerPhone: order.recipientPhone,
    buyerAddress: order.shippingLine1,
  };

  const transaction = await paymentsRepository.createTransaction({
    orderId: order.id,
    provider: 'PAYOS',
    providerOrderCode,
    amount: toMoney(amount),
    status: 'PENDING',
    requestPayload: safeJson(requestPayload),
  });

  try {
    const paymentLink = await client.paymentRequests.create(requestPayload);

    await paymentsRepository.updateTransaction(transaction.id, {
      providerPaymentLinkId: paymentLink.paymentLinkId,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      status: mapPayosStatus(paymentLink.status),
      responsePayload: safeJson(paymentLink),
    });
  } catch (error) {
    await paymentsRepository.updateTransaction(transaction.id, {
      status: 'FAILED',
      responsePayload: safeJson({
        name: error.name,
        message: error.message,
        code: error.code,
        desc: error.desc,
        status: error.status,
      }),
    });

    throw new AppError(error.desc || error.message || 'Could not create payOS payment link', 400);
  }

  return ordersRepository.findById(order.id);
};

const markPayosWebhookStatus = async ({ providerOrderCode, status, webhookPayload }) =>
  prisma.$transaction(async (tx) => {
    const transaction = await paymentsRepository.findTransactionByProviderOrderCode(providerOrderCode, tx);

    if (!transaction) {
      throw new AppError('Payment transaction not found', 404);
    }

    if (transaction.status === 'PAID' || transaction.order.paymentStatus === 'PAID') {
      return transaction;
    }

    return paymentsRepository.updateTransaction(
      transaction.id,
      {
        status,
        webhookPayload,
      },
      tx,
    );
  });

const markPayosPaid = async ({ providerOrderCode, webhookData, webhookPayload }) =>
  prisma.$transaction(async (tx) => {
    const transaction = await paymentsRepository.findTransactionByProviderOrderCode(providerOrderCode, tx);

    if (!transaction) {
      throw new AppError('Payment transaction not found', 404);
    }

    if (transaction.providerPaymentLinkId && webhookData.paymentLinkId !== transaction.providerPaymentLinkId) {
      throw new AppError('Payment link mismatch', 400);
    }

    if (Math.round(toNumber(transaction.amount)) !== Math.round(toNumber(webhookData.amount))) {
      throw new AppError('Payment amount mismatch', 400);
    }

    if (transaction.status === 'PAID' || transaction.order.paymentStatus === 'PAID') {
      return transaction;
    }

    const paidAt = webhookData.transactionDateTime ? new Date(webhookData.transactionDateTime) : new Date();

    await paymentsRepository.updateTransaction(
      transaction.id,
      {
        status: 'PAID',
        webhookPayload,
        paidAt,
      },
      tx,
    );

    await tx.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: 'PAID',
      },
    });

    await removeOrderItemsFromCart({
      userId: transaction.order.userId,
      orderItems: transaction.order.items,
      tx,
    });

    await room3dRepository.grantAccessForOrder(transaction.order, tx);

    return transaction;
  });

const handleSepayWebhook = async ({ payload, headers }) => {
  verifySepayWebhookAuth(headers);

  const transferType = sepayTransferType(payload);
  if (transferType && transferType !== 'in') {
    return {
      status: 'IGNORED',
      reason: 'not_incoming_transfer',
    };
  }

  const orderCode = extractOrderCodeFromSepay(payload);
  if (!orderCode) {
    return {
      status: 'IGNORED',
      reason: 'order_code_not_found',
    };
  }

  const amount = sepayTransferAmount(payload);
  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      status: 'IGNORED',
      reason: 'invalid_amount',
      orderCode,
    };
  }

  const providerPaymentLinkId = sepayProviderPaymentId(payload);
  const providerOrderCode = sepayProviderOrderCode(payload);
  const webhookPayload = safeJson(payload);

  const transaction = await prisma.$transaction(async (tx) => {
    if (providerPaymentLinkId) {
      const existingTransaction = await paymentsRepository.findTransactionByProviderPaymentLinkId(providerPaymentLinkId, tx);
      if (existingTransaction) {
        return existingTransaction;
      }
    }

    const order = await ordersRepository.findByCode(orderCode, tx);
    if (!order) {
      return null;
    }

    const orderTotal = Math.round(toNumber(order.total));
    const transferAmount = Math.round(amount);
    const isEnoughAmount = transferAmount >= orderTotal;
    const status = isEnoughAmount ? 'PAID' : 'UNDERPAID';
    const paidAt = payload.transactionDate || payload.transactionDateTime ? new Date(payload.transactionDate || payload.transactionDateTime) : new Date();

    const savedTransaction = await paymentsRepository.createTransaction(
      {
        orderId: order.id,
        provider: 'SEPAY',
        providerOrderCode,
        providerPaymentLinkId,
        amount: toMoney(amount),
        status,
        requestPayload: null,
        responsePayload: null,
        webhookPayload,
        paidAt: isEnoughAmount ? paidAt : null,
      },
      tx,
    );

    if (isEnoughAmount && order.paymentStatus !== 'PAID') {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: order.paymentMethod === 'BANK_TRANSFER' ? 'SEPAY' : order.paymentMethod,
        },
      });

      await removeOrderItemsFromCart({
        userId: order.userId,
        orderItems: order.items,
        tx,
      });

      await room3dRepository.grantAccessForOrder(order, tx);
    }

    return savedTransaction;
  });

  if (!transaction) {
    return {
      status: 'NO_ORDER',
      orderCode,
    };
  }

  return {
    status: transaction.status,
    orderCode,
    amount,
  };
};

const handlePayosWebhook = async (payload) => {
  const client = getPayosClient();
  const webhookData = await client.webhooks.verify(payload);
  const providerOrderCode = BigInt(webhookData.orderCode);
  const webhookPayload = safeJson(payload);
  const isPaid =
    payload?.success === true &&
    payload?.code === '00' &&
    webhookData.code === '00' &&
    String(webhookData.desc || '').toLowerCase() !== 'cancelled';

  if (!isPaid) {
    try {
      await markPayosWebhookStatus({
        providerOrderCode,
        status: mapPayosStatus(webhookData.code === '00' ? 'PROCESSING' : 'FAILED'),
        webhookPayload,
      });
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
    }

    return {
      status: 'IGNORED',
      orderCode: webhookData.orderCode,
    };
  }

  try {
    await markPayosPaid({
      providerOrderCode,
      webhookData,
      webhookPayload,
    });
  } catch (error) {
    if (error.statusCode === 404) {
      return {
        status: 'NO_TRANSACTION',
        orderCode: webhookData.orderCode,
        paymentLinkId: webhookData.paymentLinkId,
      };
    }

    throw error;
  }

  return {
    status: 'PAID',
    orderCode: webhookData.orderCode,
    paymentLinkId: webhookData.paymentLinkId,
  };
};

const getPublicPayosConfig = () => ({
  configured: isPayosConfigured(),
  urls: payosUrls(),
});

const hasSepayQrConfig = () =>
  Boolean(config.sepay.accountNo && config.sepay.qrBankName);

const getPublicSepayConfig = () => ({
  configured: hasSepayQrConfig(),
  urls: sepayUrls(),
});

module.exports = {
  createPayosPaymentForOrder,
  getPublicPayosConfig,
  getPublicSepayConfig,
  handlePayosWebhook,
  handleSepayWebhook,
  isPayosConfigured,
  resetPayosClient,
};
