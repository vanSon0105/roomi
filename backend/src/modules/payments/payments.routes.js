const express = require('express');

const paymentsController = require('./payments.controller');

const router = express.Router();

router.get('/payos/config', paymentsController.getPayosConfig);
router.post('/payos/webhook', paymentsController.handlePayosWebhook);
router.get('/sepay/config', paymentsController.getSepayConfig);
router.post('/sepay/webhook', paymentsController.handleSepayWebhook);

module.exports = router;
