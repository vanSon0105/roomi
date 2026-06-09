const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const ordersService = require('./orders.service');

const createOrder = asyncHandler(async (req, res) => {
  const data = await ordersService.createOrder(req.user.id, req.validated.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Order created successfully',
    data,
  });
});

const getOrder = asyncHandler(async (req, res) => {
  const data = await ordersService.getOrder(req.user.id, req.validated.params.code);

  sendSuccess(res, {
    message: 'Order fetched successfully',
    data,
  });
});

const reportPaid = asyncHandler(async (req, res) => {
  const data = await ordersService.reportPaid(req.user.id, req.validated.params.code);

  sendSuccess(res, {
    message: 'Payment report received',
    data,
  });
});

const useCashOnDelivery = asyncHandler(async (req, res) => {
  const data = await ordersService.useCashOnDelivery(req.user.id, req.validated.params.code);

  sendSuccess(res, {
    message: 'Payment method updated to cash on delivery',
    data,
  });
});

module.exports = {
  createOrder,
  getOrder,
  reportPaid,
  useCashOnDelivery,
};
