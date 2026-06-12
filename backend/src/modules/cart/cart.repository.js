const prisma = require('../../config/prisma');

const cartInclude = {
  items: {
    orderBy: { id: 'asc' },
    include: {
      product: {
        include: {
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
        },
      },
    },
  },
};

const findByUserId = (userId) =>
  prisma.cart.findUnique({
    where: { userId },
    include: cartInclude,
  });

const findOrCreateByUserId = async (userId) => {
  const cart = await findByUserId(userId);

  if (cart) {
    return cart;
  }

  return prisma.cart.create({
    data: { userId },
    include: cartInclude,
  });
};

const findProductForCart = ({ productId, productSlug }) =>
  prisma.product.findFirst({
    where: {
      status: 'ACTIVE',
      ...(productId ? { id: productId } : { slug: productSlug }),
    },
  });

const upsertItem = ({ cartId, productId, quantity }) =>
  prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
    update: {
      quantity: {
        increment: quantity,
      },
    },
    create: {
      cartId,
      productId,
      quantity,
    },
  });

const findItemWithCart = (itemId) =>
  prisma.cartItem.findUnique({
    where: { id: itemId },
    include: {
      product: true,
      cart: {
        select: {
          userId: true,
        },
      },
    },
  });

const findItemForCartProduct = ({ cartId, productId }) =>
  prisma.cartItem.findUnique({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
  });

const updateItemQuantity = (itemId, quantity) =>
  prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

const deleteItem = (itemId) =>
  prisma.cartItem.delete({
    where: { id: itemId },
  });

module.exports = {
  deleteItem,
  findByUserId,
  findItemWithCart,
  findItemForCartProduct,
  findOrCreateByUserId,
  findProductForCart,
  updateItemQuantity,
  upsertItem,
};
