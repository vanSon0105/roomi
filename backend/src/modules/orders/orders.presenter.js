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
  const isBankTransfer = order.paymentMethod === 'BANK_TRANSFER';
  const transferContent = isBankTransfer ? order.code : null;

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
      provider: isBankTransfer ? 'VIETQR' : 'COD',
      configured: isBankTransfer && hasVietQrConfig(),
      reported: Boolean(order.paymentReportedAt),
      reportedAt: order.paymentReportedAt,
      amount: total,
      transferContent,
      qrUrl: isBankTransfer ? buildVietQrUrl({ amount: total, transferContent }) : null,
      bankId: isBankTransfer ? config.vietqr.bankId || null : null,
      accountNo: isBankTransfer ? config.vietqr.accountNo || null : null,
      accountName: isBankTransfer ? config.vietqr.accountName || null : null,
      template: isBankTransfer ? config.vietqr.template : null,
    },
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

module.exports = {
  serializeOrder,
};
