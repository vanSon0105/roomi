const config = require('../../config/env');

const toNumber = (value) => (value == null ? 0 : Number(value));

const hasVietQrConfig = () =>
  Boolean(config.vietqr.bankId && config.vietqr.accountNo && config.vietqr.accountName);

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
  const total = toNumber(order.total);
  const transferContent = order.code;

  return {
    id: order.id,
    code: order.code,
    recipientName: order.recipientName,
    recipientPhone: order.recipientPhone,
    shippingLine1: order.shippingLine1,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: toNumber(order.subtotal),
    shippingFee: toNumber(order.shippingFee),
    discountAmount: toNumber(order.discountAmount),
    total,
    note: order.note,
    paymentReportedAt: order.paymentReportedAt,
    items: (order.items || []).map(serializeOrderItem),
    payment: {
      provider: 'VIETQR',
      configured: hasVietQrConfig(),
      reported: Boolean(order.paymentReportedAt),
      reportedAt: order.paymentReportedAt,
      amount: total,
      transferContent,
      qrUrl: buildVietQrUrl({ amount: total, transferContent }),
      bankId: config.vietqr.bankId || null,
      accountNo: config.vietqr.accountNo || null,
      accountName: config.vietqr.accountName || null,
      template: config.vietqr.template,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

module.exports = {
  serializeOrder,
};
