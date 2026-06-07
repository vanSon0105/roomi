const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const cartService = require('./cart.service');

const getCart = asyncHandler(async (req, res) => {
  const data = await cartService.getCart(req.user.id);

  sendSuccess(res, {
    message: 'Cart fetched successfully',
    data,
  });
});

const addItem = asyncHandler(async (req, res) => {
  const data = await cartService.addItem(req.user.id, req.validated.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Cart item added successfully',
    data,
  });
});

const updateItem = asyncHandler(async (req, res) => {
  const data = await cartService.updateItem(
    req.user.id,
    req.validated.params.itemId,
    req.validated.body,
  );

  sendSuccess(res, {
    message: 'Cart item updated successfully',
    data,
  });
});

const removeItem = asyncHandler(async (req, res) => {
  const data = await cartService.removeItem(req.user.id, req.validated.params.itemId);

  sendSuccess(res, {
    message: 'Cart item removed successfully',
    data,
  });
});

module.exports = {
  addItem,
  getCart,
  removeItem,
  updateItem,
};
