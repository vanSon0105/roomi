const prisma = require('../../config/prisma');

const withClient = (client) => client || prisma;

const createTransaction = (data, client) =>
  withClient(client).paymentTransaction.create({
    data,
  });

const findTransactionByProviderOrderCode = (providerOrderCode, client) =>
  withClient(client).paymentTransaction.findUnique({
    where: {
      providerOrderCode,
    },
    include: {
      order: {
        include: {
          items: {
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  });

const findTransactionByProviderPaymentLinkId = (providerPaymentLinkId, client) =>
  withClient(client).paymentTransaction.findUnique({
    where: {
      providerPaymentLinkId,
    },
    include: {
      order: {
        include: {
          items: {
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  });

const findLatestTransactionByOrderId = (orderId, client) =>
  withClient(client).paymentTransaction.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });

const updateTransaction = (id, data, client) =>
  withClient(client).paymentTransaction.update({
    where: { id },
    data,
  });

module.exports = {
  createTransaction,
  findLatestTransactionByOrderId,
  findTransactionByProviderOrderCode,
  findTransactionByProviderPaymentLinkId,
  updateTransaction,
};
