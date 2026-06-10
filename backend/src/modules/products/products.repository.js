const prisma = require('../../config/prisma');

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

const buildWhere = ({ category, search, featured } = {}) => {
  const where = {
    status: 'ACTIVE',
  };

  if (category && category !== 'all') {
    where.category = {
      slug: category,
    };
  }

  if (search) {
    where.name = { contains: search };
  }

  if (featured === true) {
    where.isFeatured = true;
  }

  return where;
};

const findCategories = () =>
  prisma.category.findMany({
    where: {
      products: {
        some: {
          status: 'ACTIVE',
        },
      },
    },
    include: {
      _count: {
        select: {
          products: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

const findMany = async ({ page, limit, category, search, featured } = {}) => {
  const skip = (page - 1) * limit;
  const where = buildWhere({ category, search, featured });

  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { id: 'asc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
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

const findBySlug = (slug) =>
  prisma.product.findFirst({
    where: {
      slug,
      status: 'ACTIVE',
    },
    include: productInclude,
  });

const findRelated = ({ slug, categoryId, limit }) =>
  prisma.product.findMany({
    where: {
      slug: {
        not: slug,
      },
      status: 'ACTIVE',
      ...(categoryId
        ? {
            categoryId,
          }
        : {}),
    },
    include: productInclude,
    orderBy: { id: 'asc' },
    take: limit,
  });

const findFallbackRelated = ({ slug, excludeIds, limit }) =>
  prisma.product.findMany({
    where: {
      slug: {
        not: slug,
      },
      id: {
        notIn: excludeIds,
      },
      status: 'ACTIVE',
    },
    include: productInclude,
    orderBy: { id: 'asc' },
    take: limit,
  });

module.exports = {
  findBySlug,
  findCategories,
  findFallbackRelated,
  findMany,
  findRelated,
};
