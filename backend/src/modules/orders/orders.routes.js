const express = require('express');

const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const ordersController = require('./orders.controller');
const {
  createOrderSchema,
  orderCodeParamSchema,
} = require('./orders.validation');

const router = express.Router();

// Public — cho trang checkout-success sau khi PayOS/SePay redirect về
router.get('/public/:code', validate(orderCodeParamSchema), ordersController.getOrderPublic);
router.get('/public/provider/:code', validate(orderCodeParamSchema), ordersController.getOrderByProviderCode);

router.use(authMiddleware);

router.post('/', validate(createOrderSchema), ordersController.createOrder);
router.post('/:code/report-paid', validate(orderCodeParamSchema), ordersController.reportPaid);
router.post('/:code/cash-on-delivery', validate(orderCodeParamSchema), ordersController.useCashOnDelivery);
router.get('/:code', validate(orderCodeParamSchema), ordersController.getOrder);

module.exports = router;
