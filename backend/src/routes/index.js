const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const cartRoutes = require('../modules/cart/cart.routes');
const productsController = require('../modules/products/products.controller');
const usersRoutes = require('../modules/users/users.routes');
const productsRoutes = require('../modules/products/products.routes');
const { sendSuccess } = require('../utils/api-response');

const router = express.Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, {
    message: 'OK',
    data: {
      service: 'backend',
      status: 'healthy',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/cart', cartRoutes);
router.get('/categories', productsController.getCategories);
router.use('/products', productsRoutes);
router.use('/users', usersRoutes);

module.exports = router;
