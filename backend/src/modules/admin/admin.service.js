const prisma = require('../../config/prisma');
const AppError = require('../../utils/app-error');
const { serializeOrder } = require('../orders/orders.presenter');
const { serializeProduct } = require('../products/products.presenter');

const toNumber = (value) => (value == null ? 0 : Number(value));
const toMoney = (value) => Number(value).toFixed(2);

const productInclude = {
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      imageUrl: true,
      altText: true,
      sortOrder: true,
      isPrimary: true,
    },
  },
};

const orderInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  },
  items: {
    orderBy: { id: 'asc' },
  },
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  birthday: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      orders: true,
    },
  },
};

const pagination = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

const serializeAdminOrder = (order) => {
  const serialized = serializeOrder(order);

  return {
    ...serialized,
    user: order.user
      ? {
          id: order.user.id,
          name: order.user.name,
          email: order.user.email,
          phone: order.user.phone,
          role: order.user.role,
        }
      : null,
    itemCount: (order.items || []).reduce((sum, item) => sum + item.quantity, 0),
  };
};

const serializeAdminUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  birthday: user.birthday,
  role: user.role,
  orderCount: user._count?.orders || 0,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const buildOrderWhere = ({ search, status, paymentStatus } = {}) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (search) {
    where.OR = [
      { code: { contains: search } },
      { recipientName: { contains: search } },
      { recipientPhone: { contains: search } },
      { note: { contains: search } },
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { user: { phone: { contains: search } } },
      { items: { some: { productName: { contains: search } } } },
    ];
  }

  return where;
};

const buildProductWhere = ({ search, status } = {}) => {
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { slug: { contains: search } },
      { sku: { contains: search } },
      { shortDescription: { contains: search } },
    ];
  }

  return where;
};

const buildUserWhere = ({ search, role } = {}) => {
  const where = {};

  if (role && role !== 'ALL') {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  return where;
};

const getStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    todayOrders,
    pendingPayment,
    paymentReported,
    processingOrders,
    totalProducts,
    totalUsers,
    revenue,
    todayRevenue,
    latestOrders,
    lowStockProducts,
    topProducts,
  ] = await prisma.$transaction([
    prisma.order.count(),
    prisma.order.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    }),
    prisma.order.count({
      where: {
        status: 'PENDING',
        paymentStatus: 'UNPAID',
      },
    }),
    prisma.order.count({
      where: {
        paymentReportedAt: {
          not: null,
        },
        paymentStatus: 'UNPAID',
      },
    }),
    prisma.order.count({
      where: {
        status: 'PROCESSING',
      },
    }),
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.aggregate({
      where: {
        paymentStatus: 'PAID',
        createdAt: {
          gte: today,
        },
      },
      _sum: {
        total: true,
      },
    }),
    prisma.order.findMany({
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      include: productInclude,
      orderBy: [{ stock: 'asc' }, { updatedAt: 'desc' }],
      take: 6,
    }),
    prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    }),
  ]);

  return {
    cards: {
      totalOrders,
      todayOrders,
      pendingPayment,
      paymentReported,
      processingOrders,
      totalProducts,
      totalUsers,
      revenue: toNumber(revenue._sum.total),
      todayRevenue: toNumber(todayRevenue._sum.total),
    },
    latestOrders: latestOrders.map(serializeAdminOrder),
    lowStockProducts: lowStockProducts.map(serializeProduct),
    topProducts: topProducts.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item._sum.quantity || 0,
      revenue: toNumber(item._sum.totalPrice),
    })),
  };
};

const getOrders = async ({ page, limit, search, status, paymentStatus }) => {
  const where = buildOrderWhere({ search, status, paymentStatus });
  const skip = (page - 1) * limit;

  const [items, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: items.map(serializeAdminOrder),
    pagination: pagination({ page, limit, total }),
  };
};

const getOrderByCode = async (code) => {
  const order = await prisma.order.findUnique({
    where: { code },
    include: orderInclude,
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  return serializeAdminOrder(order);
};

const updateOrder = async (code, payload) => {
  const existingOrder = await prisma.order.findUnique({
    where: { code },
    select: { id: true },
  });

  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  const data = { ...payload };

  if (payload.paymentStatus === 'PAID') {
    data.paymentReportedAt = new Date();
  }

  const order = await prisma.order.update({
    where: { code },
    data,
    include: orderInclude,
  });

  return serializeAdminOrder(order);
};

const getProducts = async ({ page, limit, search, status }) => {
  const where = buildProductWhere({ search, status });
  const skip = (page - 1) * limit;

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(serializeProduct),
    pagination: pagination({ page, limit, total }),
  };
};

const updateProduct = async (id, payload) => {
  const data = { ...payload };

  if (Object.prototype.hasOwnProperty.call(data, 'price')) {
    data.price = toMoney(data.price);
  }

  if (Object.prototype.hasOwnProperty.call(data, 'compareAtPrice')) {
    data.compareAtPrice = data.compareAtPrice == null ? null : toMoney(data.compareAtPrice);
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    include: productInclude,
  });

  return serializeProduct(product);
};

const getUsers = async ({ page, limit, search, role }) => {
  const where = buildUserWhere({ search, role });
  const skip = (page - 1) * limit;

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: items.map(serializeAdminUser),
    pagination: pagination({ page, limit, total }),
  };
};

const updateUser = async (id, payload) => {
  const user = await prisma.user.update({
    where: { id },
    data: payload,
    select: userSelect,
  });

  return serializeAdminUser(user);
};

module.exports = {
  getOrderByCode,
  getOrders,
  getProducts,
  getStats,
  getUsers,
  updateOrder,
  updateProduct,
  updateUser,
};
