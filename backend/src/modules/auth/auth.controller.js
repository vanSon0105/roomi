const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const authService = require('./auth.service');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.validated.body);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Register success',
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.validated.body);

  sendSuccess(res, {
    message: 'Login success',
    data,
  });
});

module.exports = {
  login,
  register,
};
