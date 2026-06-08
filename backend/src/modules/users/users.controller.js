const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const AppError = require('../../utils/app-error');
const { buildAvatarUrl } = require('../../utils/avatar-storage');
const usersService = require('./users.service');

const getUsers = asyncHandler(async (req, res) => {
  const data = await usersService.getUsers(req.validated.query);

  sendSuccess(res, {
    message: 'Users fetched successfully',
    data,
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const data = await usersService.getCurrentUser(req.user.id);

  sendSuccess(res, {
    message: 'Current user fetched successfully',
    data,
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const data = await usersService.getUserById(req.validated.params.id);

  sendSuccess(res, {
    message: 'User fetched successfully',
    data,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const data = await usersService.updateUser(req.validated.params.id, req.validated.body);

  sendSuccess(res, {
    message: 'User updated successfully',
    data,
  });
});

const updateCurrentUser = asyncHandler(async (req, res) => {
  const data = await usersService.updateUser(req.user.id, req.validated.body);

  sendSuccess(res, {
    message: 'Current user updated successfully',
    data,
  });
});

const uploadCurrentUserAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Vui lòng chọn ảnh đại diện', 400);
  }

  const data = await usersService.updateCurrentUserAvatar(req.user.id, buildAvatarUrl(req.file.filename));

  sendSuccess(res, {
    message: 'Avatar uploaded successfully',
    data,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const data = await usersService.deleteUser(req.validated.params.id);

  sendSuccess(res, {
    message: 'User deleted successfully',
    data,
  });
});

module.exports = {
  deleteUser,
  getCurrentUser,
  getUserById,
  getUsers,
  updateCurrentUser,
  updateUser,
  uploadCurrentUserAvatar,
};
