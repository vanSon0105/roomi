const prisma = require('../../config/prisma');

const withClient = (client) => client || prisma;

const findAccessForUser = (userId, client) =>
  withClient(client).room3DAccess.findUnique({
    where: { userId },
    include: {
      order: true,
    },
  });

const grantAccessForOrder = async (order, client) => {
  if (!order || order.orderType !== 'ROOM3D_ACCESS') {
    return null;
  }

  return withClient(client).room3DAccess.upsert({
    where: { userId: order.userId },
    create: {
      userId: order.userId,
      orderId: order.id,
      pricePaid: order.total,
      grantedAt: new Date(),
      expiresAt: null,
    },
    update: {
      orderId: order.id,
      pricePaid: order.total,
      grantedAt: new Date(),
      expiresAt: null,
    },
  });
};

const countAccesses = (client) => withClient(client).room3DAccess.count();

const latestAccesses = (limit = 8, client) =>
  withClient(client).room3DAccess.findMany({
    take: limit,
    orderBy: { grantedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      order: {
        select: {
          code: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
        },
      },
    },
  });

module.exports = {
  countAccesses,
  findAccessForUser,
  grantAccessForOrder,
  latestAccesses,
};
