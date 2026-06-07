const express = require('express');

const validate = require('../../middlewares/validate.middleware');
const productsController = require('./products.controller');
const {
  listProductsSchema,
  productSlugParamSchema,
  relatedProductsSchema,
} = require('./products.validation');

const router = express.Router();

router.get('/', validate(listProductsSchema), productsController.getProducts);
router.get('/:slug/related', validate(relatedProductsSchema), productsController.getRelatedProducts);
router.get('/:slug', validate(productSlugParamSchema), productsController.getProductBySlug);

module.exports = router;
