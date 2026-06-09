const express = require('express');

const adminController = require('./admin.controller');
const settingsController = require('../settings/settings.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  listOrdersSchema,
  listProductsSchema,
  listUsersSchema,
  orderCodeParamSchema,
  updateOrderSchema,
  updateProductSchema,
  updateUserSchema,
} = require('./admin.validation');
const { updateSettingsSchema } = require('../settings/settings.validation');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/settings', settingsController.getAdminSettings);
router.put('/settings', validate(updateSettingsSchema), settingsController.updateAdminSettings);
router.get('/orders', validate(listOrdersSchema), adminController.getOrders);
router.get('/orders/:code', validate(orderCodeParamSchema), adminController.getOrderByCode);
router.patch('/orders/:code', validate(updateOrderSchema), adminController.updateOrder);
router.get('/products', validate(listProductsSchema), adminController.getProducts);
router.patch('/products/:id', validate(updateProductSchema), adminController.updateProduct);
router.get('/users', validate(listUsersSchema), adminController.getUsers);
router.patch('/users/:id', validate(updateUserSchema), adminController.updateUser);

module.exports = router;
