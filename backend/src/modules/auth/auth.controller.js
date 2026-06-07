const asyncHandler = require('../../utils/async-handler');
const { sendSuccess } = require('../../utils/api-response');
const authService = require('./auth.service');
const {
  getUserFromRequest,
  serializeAuthCookie,
  serializeClearAuthCookie,
} = require('./auth-token');

const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.validated.body);

  res.setHeader('Set-Cookie', serializeAuthCookie(data.token));
  sendSuccess(res, {
    statusCode: 201,
    message: 'Register success',
    data,
  });
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.validated.body);

  res.setHeader('Set-Cookie', serializeAuthCookie(data.token));
  sendSuccess(res, {
    message: 'Login success',
    data,
  });
});

const logout = asyncHandler(async (_req, res) => {
  res.setHeader('Set-Cookie', serializeClearAuthCookie());
  sendSuccess(res, {
    message: 'Logout success',
  });
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, {
    data: {
      user: req.user,
    },
  });
});

const pageAccess = asyncHandler(async (req, res) => {
  let user = null;

  try {
    user = getUserFromRequest(req);
  } catch (_error) {
    user = null;
  }

  sendSuccess(res, {
    data: authService.getPageAccess({
      path: req.validated.query.path,
      user,
    }),
  });
});

module.exports = {
  login,
  logout,
  me,
  pageAccess,
  register,
};
