const jwt = require('jsonwebtoken');

const config = require('../config/env');
const AppError = require('../utils/app-error');

const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is required', 401));
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (_error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

module.exports = authMiddleware;
