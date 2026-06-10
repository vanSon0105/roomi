const express = require('express');

const chatController = require('./chat.controller');
const optionalAuth = require('../../middlewares/optional-auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { sendMessageSchema } = require('./chat.validation');

const router = express.Router();

// Customer routes — optional auth (guest can also chat)
router.get('/', optionalAuth, chatController.getMessages);
router.post('/', optionalAuth, validate(sendMessageSchema), chatController.sendMessage);

module.exports = router;
