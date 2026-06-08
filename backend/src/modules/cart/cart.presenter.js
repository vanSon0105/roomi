const { serializeProduct } = require('../products/products.presenter');
const config = require('../../config/env');

const toNumber = (value) => (value == null ? null : Number(value));

const serializeCart = (cart) => {
  const items = (cart?.items || []).map((item) => {
    const product = serializeProduct(item.product);
    const total = toNumber(item.product.price) * item.quantity;

    return {
      id: item.id,
      quantity: item.quantity,
      product,
      total,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const shippingFee = config.checkoutShippingFee;

  return {
    id: cart?.id || null,
    items,
    subtotal,
    shippingFee,
    checkoutTotal: subtotal + shippingFee,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
};

module.exports = {
  serializeCart,
};
