const express = require('express');

const authMiddleware = require('../../middlewares/auth.middleware');
const room3dController = require('./room3d.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/access', room3dController.getAccessStatus);
router.post('/orders', room3dController.createAccessOrder);
router.post('/cancel', room3dController.cancelAccessOrder);

module.exports = router;
