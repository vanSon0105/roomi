const jwt = require('jsonwebtoken');

const config = require('../../config/env');

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((cookies, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split('=');

    if (!rawKey) {
      return cookies;
    }

    cookies[rawKey] = decodeURIComponent(rawValue.join('=') || '');
    return cookies;
  }, {});

const signToken = (user) =>
  jwt.sign(
    {
      email: user.email,
      role: user.role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
      subject: String(user.id),
    },
  );

const verifyToken = (token) => {
  const payload = jwt.verify(token, config.jwtSecret);

  return {
    id: Number(payload.sub),
    email: payload.email,
    role: payload.role,
  };
};

const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  const cookies = parseCookies(req.headers.cookie);
  return cookies[config.authCookieName] || null;
};

const getUserFromRequest = (req) => {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return verifyToken(token);
};

const serializeAuthCookie = (token) => {
  const secure = config.nodeEnv === 'production' ? '; Secure' : '';

  return [
    `${config.authCookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${config.authCookieMaxAgeSeconds}`,
    secure,
  ]
    .filter(Boolean)
    .join('; ');
};

const serializeClearAuthCookie = () =>
  [
    `${config.authCookieName}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
  ].join('; ');

module.exports = {
  getTokenFromRequest,
  getUserFromRequest,
  serializeAuthCookie,
  serializeClearAuthCookie,
  signToken,
  verifyToken,
};
