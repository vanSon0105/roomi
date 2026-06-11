const config = require('../../config/env');

const toNumber = (value) => (value == null ? 0 : Number(value));

const hasVietQrConfig = () =>
  Boolean(config.vietqr.bankId && config.vietqr.accountNo && config.vietqr.accountName);

const hasPayosConfig = () =>
  Boolean(config.payos.clientId && config.payos.apiKey && config.payos.checksumKey);

const hasSepayQrConfig = () =>
  Boolean(config.sepay.accountNo && config.sepay.qrBankName);

const buildVietQrUrl = ({ amount, transferContent }) => {
  if (!hasVietQrConfig()) {
    return null;
  }

  const pathBankId = encodeURIComponent(config.vietqr.bankId);
  const pathAccountNo = encodeURIComponent(config.vietqr.accountNo);
  const pathTemplate = encodeURIComponent(config.vietqr.template);
  const params = new URLSearchParams({
    amount: String(Math.round(amount)),
    addInfo: transferContent,
    accountName: config.vietqr.accountName,
  });

  return `https://img.vietqr.io/image/${pathBankId}-${pathAccountNo}-${pathTemplate}.png?${params.toString()}`;
};

const buildSeVqrUrl = ({ amount, transferContent }) => {
  if (!hasSepayQrConfig()) {
    return null;
  }

  const params = new URLSearchParams({
    acc: config.sepay.accountNo,
    bank: config.sepay.qrBankName,
    amount: String(Math.round(amount)),
    des: transferContent,
  });

  return `${config.sepay.qrBaseUrl}?${params.toString()}`;
};

const serializeOrderItem = (item) => ({
  id: item.id,
  productId: item.productId,
  productName: item.productName,
  productSku: item.productSku,
  unitPrice: toNumber(item.unitPrice),
  quantity: item.quantity,
  totalPrice: toNumber(item.totalPrice),
});

const serializeOrder = (order) => {
  const subtotal = toNumber(order.subtotal);
  const total = toNumber(order.total);
  const isBankTransfer = order.paymentMethod === 'BANK_TRANSFER';
  const isSepay = order.paymentMethod === 'SEPAY';
  const isPayos = order.paymentMethod === 'PAYOS';
  const transferContent = isSepay ? `SEVQR ${order.code}` : isBankTransfer ? order.code : null;
  const latestPaymentTransaction = order.paymentTransactions?.[0] || null;

  return {
    id: order.id,
    code: order.code,
    orderType: order.orderType || 'PRODUCT',
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    shippingLine1: order.shippingLine1,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal,
    shippingFee: toNumber(order.shippingFee),
    discountAmount: toNumber(order.discountAmount),
    total,
    note: order.note,
    paymentReportedAt: order.paymentReportedAt,
    items: (order.items || []).map(serializeOrderItem),
    payment: {
      provider: isPayos ? 'PAYOS' : isSepay ? 'SEPAY' : isBankTransfer ? 'VIETQR' : 'COD',
      configured: isPayos ? hasPayosConfig() : isSepay ? hasSepayQrConfig() : isBankTransfer && hasVietQrConfig(),
      reported: Boolean(order.paymentReportedAt),
      reportedAt: order.paymentReportedAt,
      amount: total,
      transferContent,
      qrUrl: isPayos ? null : isSepay ? buildSeVqrUrl({ amount: total, transferContent }) : isBankTransfer ? buildVietQrUrl({ amount: total, transferContent }) : null,
      checkoutUrl: isPayos ? latestPaymentTransaction?.checkoutUrl || null : null,
      qrCode: isPayos ? latestPaymentTransaction?.qrCode || null : null,
      transactionStatus: isPayos || isSepay ? latestPaymentTransaction?.status || null : null,
      paymentLinkId: isPayos ? latestPaymentTransaction?.providerPaymentLinkId || null : null,
      bankId: isBankTransfer ? config.vietqr.bankId || null : isSepay ? config.sepay.qrBankName || null : null,
      accountNo: isSepay ? config.sepay.accountNo || null : isBankTransfer ? config.vietqr.accountNo || null : null,
      accountName: isSepay ? config.sepay.accountName || null : isBankTransfer ? config.vietqr.accountName || null : null,
      template: isBankTransfer ? config.vietqr.template : isSepay ? 'SEVQR' : null,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

const serializePublicOrder = (order) => {
  const serialized = serializeOrder(order);

  return {
    code: serialized.code,
    orderType: serialized.orderType,
    status: serialized.status,
    paymentStatus: serialized.paymentStatus,
    paymentMethod: serialized.paymentMethod,
    subtotal: serialized.subtotal,
    shippingFee: serialized.shippingFee,
    discountAmount: serialized.discountAmount,
    total: serialized.total,
    paymentReportedAt: serialized.paymentReportedAt,
    payment: serialized.payment,
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
  };
};

module.exports = {
  serializeOrder,
  serializePublicOrder,
};
