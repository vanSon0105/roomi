const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const { sendSuccess } = require('../utils/api-response');

const router = express.Router();

router.get('/health', (_req, res) => {
  sendSuccess(res, {
    message: 'OK',
    data: {
      service: 'backend',
      status: 'healthy',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

module.exports = router;
