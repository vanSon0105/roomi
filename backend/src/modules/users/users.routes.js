const express = require('express');

const adminMiddleware = require('../../middlewares/admin.middleware');
const authMiddleware = require('../../middlewares/auth.middleware');
const avatarUploadMiddleware = require('../../middlewares/avatar-upload.middleware');
const validate = require('../../middlewares/validate.middleware');
const usersController = require('./users.controller');
const {
  listUsersSchema,
  updateCurrentUserSchema,
  updateUserSchema,
  userIdParamSchema,
} = require('./users.validation');

const router = express.Router();

router.use(authMiddleware);

router.get('/me', usersController.getCurrentUser);
router.patch('/me', validate(updateCurrentUserSchema), usersController.updateCurrentUser);
router.post('/me/avatar', avatarUploadMiddleware, usersController.uploadCurrentUserAvatar);

router.use(adminMiddleware);

router.get('/', validate(listUsersSchema), usersController.getUsers);
router.get('/:id', validate(userIdParamSchema), usersController.getUserById);
router.patch('/:id', validate(updateUserSchema), usersController.updateUser);
router.delete('/:id', validate(userIdParamSchema), usersController.deleteUser);

module.exports = router;
