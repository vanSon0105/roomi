const express = require('express');

const authMiddleware = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const usersController = require('./users.controller');
const {
  listUsersSchema,
  updateUserSchema,
  userIdParamSchema,
} = require('./users.validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/', validate(listUsersSchema), usersController.getUsers);
router.get('/me', usersController.getCurrentUser);
router.get('/:id', validate(userIdParamSchema), usersController.getUserById);
router.patch('/:id', validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', validate(userIdParamSchema), usersController.deleteUser);

module.exports = router;
