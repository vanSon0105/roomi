const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const cartRoutes = require('../modules/cart/cart.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const paymentsRoutes = require('../modules/payments/payments.routes');
const settingsRoutes = require('../modules/settings/settings.routes');
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
router.use('/admin', adminRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/settings', settingsRoutes);
router.get('/categories', productsController.getCategories);
router.use('/products', productsRoutes);
router.use('/users', usersRoutes);

module.exports = router;
