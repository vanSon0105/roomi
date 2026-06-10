const { getTokenFromRequest, verifyToken } = require('../modules/auth/auth-token');
const AppError = require('../utils/app-error');

// In-memory banned user cache — only stores banned IDs, refreshed every 60s
let bannedCache = new Set();
let cacheExpiry = 0;

const refreshBannedCache = async () => {
  const prisma = require('../config/prisma');
  const banned = await prisma.user.findMany({
    where: { isBanned: true },
    select: { id: true },
  });
  bannedCache = new Set(banned.map((u) => u.id));
  cacheExpiry = Date.now() + 60000;
};

const invalidateBanCache = () => {
  cacheExpiry = 0;
};

const authMiddleware = async (req, _res, next) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return next(new AppError('Authentication token is required', 401));
  }

  try {
    req.user = verifyToken(token);

    // Check ban status (cached, refreshed every 60s)
    if (Date.now() > cacheExpiry) {
      await refreshBannedCache();
    }
    if (bannedCache.has(req.user.id)) {
      return next(new AppError('Tài khoản của bạn đã bị khoá. Vui lòng liên hệ admin.', 403));
    }

    return next();
  } catch (_error) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

module.exports = authMiddleware;
module.exports.invalidateBanCache = invalidateBanCache;
