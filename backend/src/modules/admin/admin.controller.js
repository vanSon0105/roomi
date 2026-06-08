const adminService = require('./admin.service');
const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');

const getStats = asyncHandler(async (_req, res) => {
  const data = await adminService.getStats();

  sendSuccess(res, {
    message: 'Admin stats fetched successfully',
    data,
  });
});

const getOrders = asyncHandler(async (req, res) => {
  const data = await adminService.getOrders(req.validated.query);

  sendSuccess(res, {
    message: 'Admin orders fetched successfully',
    data,
  });
});

const getOrderByCode = asyncHandler(async (req, res) => {
  const data = await adminService.getOrderByCode(req.validated.params.code);

  sendSuccess(res, {
    message: 'Admin order fetched successfully',
    data,
  });
});

const updateOrder = asyncHandler(async (req, res) => {
  const data = await adminService.updateOrder(req.validated.params.code, req.validated.body);

  sendSuccess(res, {
    message: 'Admin order updated successfully',
    data,
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const data = await adminService.getProducts(req.validated.query);

  sendSuccess(res, {
    message: 'Admin products fetched successfully',
    data,
  });
});

const updateProduct = asyncHandler(async (req, res) => {
  const data = await adminService.updateProduct(req.validated.params.id, req.validated.body);

  sendSuccess(res, {
    message: 'Admin product updated successfully',
    data,
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const data = await adminService.getUsers(req.validated.query);

  sendSuccess(res, {
    message: 'Admin users fetched successfully',
    data,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const data = await adminService.updateUser(req.validated.params.id, req.validated.body);

  sendSuccess(res, {
    message: 'Admin user updated successfully',
    data,
  });
});

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
