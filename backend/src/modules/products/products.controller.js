const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const productsService = require('./products.service');

const getCategories = asyncHandler(async (_req, res) => {
  const data = await productsService.getCategories();

  sendSuccess(res, {
    message: 'Categories fetched successfully',
    data,
  });
});

const getProducts = asyncHandler(async (req, res) => {
  const data = await productsService.getProducts(req.validated.query);

  sendSuccess(res, {
    message: 'Products fetched successfully',
    data,
  });
});

const getProductBySlug = asyncHandler(async (req, res) => {
  const data = await productsService.getProductBySlug(req.validated.params.slug);

  sendSuccess(res, {
    message: 'Product fetched successfully',
    data,
  });
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const data = await productsService.getRelatedProducts({
    slug: req.validated.params.slug,
    limit: req.validated.query.limit,
  });

  sendSuccess(res, {
    message: 'Related products fetched successfully',
    data,
  });
});

module.exports = {
  getCategories,
  getProductBySlug,
  getProducts,
  getRelatedProducts,
};
