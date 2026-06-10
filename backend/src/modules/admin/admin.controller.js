const adminService = require('./admin.service');
const { serializeProduct } = require('../products/products.presenter');
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

const createProduct = asyncHandler(async (req, res) => {
  const data = await adminService.createProduct(req.validated.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Product created successfully',
    data,
  });
});

const getProductById = asyncHandler(async (req, res) => {
  const data = await adminService.getProductById(req.validated.params.id);

  sendSuccess(res, {
    message: 'Product fetched successfully',
    data,
  });
});

const deleteProduct = asyncHandler(async (req, res) => {
  await adminService.deleteProduct(req.validated.params.id);

  sendSuccess(res, {
    message: 'Product deleted successfully',
    data: null,
  });
});

const uploadProductImages = asyncHandler(async (req, res) => {
  const data = await adminService.uploadProductImages(req.validated.params.id, req.files || []);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Images uploaded successfully',
    data: serializeProduct(data),
  });
});

const deleteProductImage = asyncHandler(async (req, res) => {
  const data = await adminService.deleteProductImage(req.validated.params.id, Number(req.params.imageId));

  sendSuccess(res, {
    message: 'Image deleted successfully',
    data: serializeProduct(data),
  });
});

module.exports = {
  createProduct,
  deleteProduct,
  deleteProductImage,
  getOrderByCode,
  getOrders,
  getProductById,
  getProducts,
  getStats,
  getUsers,
  updateOrder,
  updateProduct,
  updateUser,
  uploadProductImages,
};
