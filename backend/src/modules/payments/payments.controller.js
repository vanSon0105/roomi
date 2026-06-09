const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const paymentsService = require('./payments.service');

const getPayosConfig = asyncHandler(async (_req, res) => {
  sendSuccess(res, {
    message: 'payOS config fetched successfully',
    data: paymentsService.getPublicPayosConfig(),
  });
});

const getSepayConfig = asyncHandler(async (_req, res) => {
  sendSuccess(res, {
    message: 'SePay config fetched successfully',
    data: paymentsService.getPublicSepayConfig(),
  });
});

const handlePayosWebhook = asyncHandler(async (req, res) => {
  const data = await paymentsService.handlePayosWebhook(req.body);

  sendSuccess(res, {
    message: 'payOS webhook received',
    data,
  });
});

const handleSepayWebhook = asyncHandler(async (req, res) => {
  const data = await paymentsService.handleSepayWebhook({
    payload: req.body,
    headers: req.headers,
  });

  sendSuccess(res, {
    message: 'SePay webhook received',
    data,
  });
});

module.exports = {
  getPayosConfig,
  getSepayConfig,
  handlePayosWebhook,
  handleSepayWebhook,
};
