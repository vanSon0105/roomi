const express = require('express');

const validate = require('../../middlewares/validate.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const authController = require('./auth.controller');
const { loginSchema, pageAccessSchema, registerSchema } = require('./auth.validation');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);
router.get('/page-access', validate(pageAccessSchema), authController.pageAccess);

module.exports = router;
