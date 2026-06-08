const AppError = require('../utils/app-error');

const adminMiddleware = (req, _res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return next(new AppError('Admin permission is required', 403));
  }

  return next();
};

module.exports = adminMiddleware;
