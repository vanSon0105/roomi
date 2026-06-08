const prisma = require('../../config/prisma');

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  birthday: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};

const userWithPasswordSelect = {
  ...safeUserSelect,
  password: true,
};

const buildSearchWhere = (search) => {
  if (!search) {
    return {};
  }

  return {
    OR: [{ name: { contains: search } }, { email: { contains: search } }],
  };
};

const findAll = async ({ page, limit, search }) => {
  const skip = (page - 1) * limit;
  const where = buildSearchWhere(search);

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const findById = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: safeUserSelect,
  });

const findByEmail = (email, { withPassword = false } = {}) =>
  prisma.user.findUnique({
    where: { email },
    select: withPassword ? userWithPasswordSelect : safeUserSelect,
  });

const findByPhone = (phone) =>
  prisma.user.findUnique({
    where: { phone },
    select: safeUserSelect,
  });

const findByEmailOrName = (identifier, { withPassword = false } = {}) =>
  prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { name: identifier }, { phone: identifier }],
    },
    select: withPassword ? userWithPasswordSelect : safeUserSelect,
  });

const create = ({ name, email, phone, password }) =>
  prisma.user.create({
    data: {
      name,
      email,
      phone,
      password,
    },
    select: safeUserSelect,
  });

const update = (id, data) =>
  prisma.user.update({
    where: { id },
    data,
    select: safeUserSelect,
  });

const remove = (id) =>
  prisma.user.delete({
    where: { id },
    select: safeUserSelect,
  });

module.exports = {
  create,
  findAll,
  findByEmail,
  findByEmailOrName,
  findById,
  findByPhone,
  remove,
  update,
};
