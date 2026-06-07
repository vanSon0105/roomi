const AppError = require('../../utils/app-error');
const cartRepository = require('./cart.repository');
const { serializeCart } = require('./cart.presenter');

const getCart = async (userId) => {
  const cart = await cartRepository.findOrCreateByUserId(userId);

  return serializeCart(cart);
};

const addItem = async (userId, { productId, productSlug, quantity }) => {
  const product = await cartRepository.findProductForCart({ productId, productSlug });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.stock <= 0) {
    throw new AppError('Product is out of stock', 409);
  }

  const cart = await cartRepository.findOrCreateByUserId(userId);
  await cartRepository.upsertItem({
    cartId: cart.id,
    productId: product.id,
    quantity,
  });

  return getCart(userId);
};

const updateItem = async (userId, itemId, { quantity }) => {
  const item = await cartRepository.findItemWithCart(itemId);

  if (!item || item.cart.userId !== userId) {
    throw new AppError('Cart item not found', 404);
  }

  if (quantity <= 0) {
    await cartRepository.deleteItem(itemId);
  } else {
    await cartRepository.updateItemQuantity(itemId, quantity);
  }

  return getCart(userId);
};

const removeItem = async (userId, itemId) => {
  const item = await cartRepository.findItemWithCart(itemId);

  if (!item || item.cart.userId !== userId) {
    throw new AppError('Cart item not found', 404);
  }

  await cartRepository.deleteItem(itemId);

  return getCart(userId);
};

module.exports = {
  addItem,
  getCart,
  removeItem,
  updateItem,
};
