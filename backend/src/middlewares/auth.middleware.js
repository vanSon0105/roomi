const { getTokenFromRequest, verifyToken } = require('../modules/auth/auth-token');
const AppError = require('../utils/app-error');

const authMiddleware = (req, _res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new AppError('Authentication token is required', 401));
  }

  try {
    req.user = verifyToken(token);

    return next();
  } catch (_error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

module.exports = authMiddleware;
