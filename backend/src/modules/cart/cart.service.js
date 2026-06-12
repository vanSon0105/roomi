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
    throw new AppError('Không tìm thấy sản phẩm.', 404);
  }

  if (product.stock <= 0) {
    throw new AppError('Sản phẩm này đang hết hàng, chưa thể thêm vào giỏ.', 409);
  }

  const cart = await cartRepository.findOrCreateByUserId(userId);
  const existingItem = await cartRepository.findItemForCartProduct({
    cartId: cart.id,
    productId: product.id,
  });
  const nextQuantity = (existingItem?.quantity || 0) + quantity;

  if (nextQuantity > product.stock) {
    throw new AppError(`Sản phẩm này chỉ còn ${product.stock} sản phẩm, bạn vui lòng giảm số lượng.`, 409);
  }

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
    throw new AppError('Không tìm thấy sản phẩm trong giỏ hàng.', 404);
  }

  if (quantity <= 0) {
    await cartRepository.deleteItem(itemId);
  } else {
    if (item.product.status !== 'ACTIVE') {
      throw new AppError('Sản phẩm này hiện không còn được bán.', 409);
    }

    if (item.product.stock <= 0) {
      throw new AppError('Sản phẩm này đang hết hàng, bạn vui lòng xóa khỏi giỏ.', 409);
    }

    if (quantity > item.product.stock) {
      throw new AppError(`Sản phẩm này chỉ còn ${item.product.stock} sản phẩm, bạn vui lòng giảm số lượng.`, 409);
    }

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
