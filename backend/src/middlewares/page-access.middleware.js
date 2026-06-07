const authService = require('../modules/auth/auth.service');
const { renderAuthRequiredPage } = require('../modules/auth/auth-required-page');
const { getUserFromRequest } = require('../modules/auth/auth-token');

const pageAccessMiddleware = (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  let user = null;

  try {
    user = getUserFromRequest(req);
  } catch (_error) {
    user = null;
  }

  const access = authService.getPageAccess({
    path: req.path,
    user,
  });

  if (access.allowed) {
    if (access.user) {
      req.user = access.user;
    }

    return next();
  }

  return res.status(access.statusCode || 401).send(
    renderAuthRequiredPage({
      page: access.page,
      message: access.message,
      redirectPath: access.redirectPath,
    }),
  );
};

module.exports = pageAccessMiddleware;
