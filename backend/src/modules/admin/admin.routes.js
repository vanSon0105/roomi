const express = require('express');

const adminController = require('./admin.controller');
const chatController = require('../chat/chat.controller');
const settingsController = require('../settings/settings.controller');
const adminMiddleware = require('../../middlewares/admin.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const productImageUpload = require('../../middlewares/product-image-upload.middleware');
const {
  createProductSchema,
  listOrdersSchema,
  listProductsSchema,
  listUsersSchema,
  orderCodeParamSchema,
  productIdParamSchema,
  updateOrderSchema,
  updateProductSchema,
  updateUserSchema,
} = require('./admin.validation');
const { updateSettingsSchema } = require('../settings/settings.validation');
const { adminReplySchema } = require('../chat/chat.validation');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/stats', adminController.getStats);
router.get('/settings', settingsController.getAdminSettings);
router.put('/settings', validate(updateSettingsSchema), settingsController.updateAdminSettings);
router.get('/orders', validate(listOrdersSchema), adminController.getOrders);
router.get('/orders/:code', validate(orderCodeParamSchema), adminController.getOrderByCode);
router.patch('/orders/:code', validate(updateOrderSchema), adminController.updateOrder);
router.get('/products', validate(listProductsSchema), adminController.getProducts);
router.get('/products/:id', validate(productIdParamSchema), adminController.getProductById);
router.post('/products', validate(createProductSchema), adminController.createProduct);
router.patch('/products/:id', validate(updateProductSchema), adminController.updateProduct);
router.delete('/products/:id', validate(productIdParamSchema), adminController.deleteProduct);
router.post('/products/:id/images', validate(productIdParamSchema), productImageUpload, adminController.uploadProductImages);
router.delete('/products/:id/images/:imageId', validate(productIdParamSchema), adminController.deleteProductImage);
router.get('/users', validate(listUsersSchema), adminController.getUsers);
router.patch('/users/:id', validate(updateUserSchema), adminController.updateUser);
router.get('/chat/conversations', chatController.getConversations);
router.get('/chat/unread', chatController.getUnreadCount);
router.get('/chat/:key', chatController.getConversation);
router.post('/chat/:key', validate(adminReplySchema), chatController.adminReply);

module.exports = router;
