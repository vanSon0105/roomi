const express = require('express');

const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const cartController = require('./cart.controller');
const {
  addCartItemSchema,
  cartItemParamSchema,
  updateCartItemSchema,
} = require('./cart.validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', cartController.getCart);
router.post('/items', validate(addCartItemSchema), cartController.addItem);
router.patch('/items/:itemId', validate(updateCartItemSchema), cartController.updateItem);
router.delete('/items/:itemId', validate(cartItemParamSchema), cartController.removeItem);

module.exports = router;
