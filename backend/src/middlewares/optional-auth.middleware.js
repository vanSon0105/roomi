const { getTokenFromRequest, verifyToken } = require('../modules/auth/auth-token');

const optionalAuth = (req, _res, next) => {
  try {
    const token = getTokenFromRequest(req);
    if (token) {
      req.user = verifyToken(token);
    }
  } catch (_error) {
    // No valid token — proceed as guest
  }

  next();
};

module.exports = optionalAuth;
