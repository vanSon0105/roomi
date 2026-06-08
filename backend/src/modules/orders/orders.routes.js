const express = require('express');

const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const ordersController = require('./orders.controller');
const {
  createOrderSchema,
  orderCodeParamSchema,
} = require('./orders.validation');

const router = express.Router();

router.use(authMiddleware);

router.post('/', validate(createOrderSchema), ordersController.createOrder);
router.post('/:code/report-paid', validate(orderCodeParamSchema), ordersController.reportPaid);
router.get('/:code', validate(orderCodeParamSchema), ordersController.getOrder);

module.exports = router;
