const { getTokenFromRequest, verifyToken } = require('../modules/auth/auth-token');
const AppError = require('../utils/app-error');

const authMiddleware = async (req, _res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new AppError('Authentication token is required', 401));
  }

  try {
    req.user = verifyToken(token);

    // Check if user has been banned since token was issued
    const prisma = require('../config/prisma');
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isBanned: true },
    });

    if (user?.isBanned) {
      return next(new AppError('Tài khoản của bạn đã bị khoá. Vui lòng liên hệ admin.', 403));
    }

    return next();
  } catch (_error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

module.exports = authMiddleware;
