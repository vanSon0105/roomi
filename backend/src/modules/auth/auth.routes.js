const express = require('express');

const validate = require('../../middlewares/validate.middleware');
const authController = require('./auth.controller');
const { loginSchema, registerSchema } = require('./auth.validation');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
