const express = require('express');

const settingsController = require('./settings.controller');

const router = express.Router();

// Public — client needs to know which provider is active
router.get('/transfer-provider', settingsController.getTransferProvider);

module.exports = router;
