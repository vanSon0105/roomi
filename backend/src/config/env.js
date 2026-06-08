require('dotenv').config();

const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  authCookieName: process.env.AUTH_COOKIE_NAME || 'roomi_token',
  authCookieMaxAgeSeconds: Number(process.env.AUTH_COOKIE_MAX_AGE_SECONDS || 7 * 24 * 60 * 60),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
  checkoutShippingFee: Number(process.env.CHECKOUT_SHIPPING_FEE || 30000),
  vietqr: {
    bankId: process.env.VIETQR_BANK_ID || '',
    accountNo: process.env.VIETQR_ACCOUNT_NO || '',
    accountName: process.env.VIETQR_ACCOUNT_NAME || '',
    template: process.env.VIETQR_TEMPLATE || 'compact2',
  },
};

if (!Number.isInteger(config.port) || config.port <= 0) {
  throw new Error('PORT must be a positive number');
}

if (!Number.isInteger(config.bcryptSaltRounds) || config.bcryptSaltRounds < 8) {
  throw new Error('BCRYPT_SALT_ROUNDS must be an integer greater than or equal to 8');
}

if (!Number.isFinite(config.checkoutShippingFee) || config.checkoutShippingFee < 0) {
  throw new Error('CHECKOUT_SHIPPING_FEE must be a non-negative number');
}

if (!Number.isInteger(config.authCookieMaxAgeSeconds) || config.authCookieMaxAgeSeconds <= 0) {
  throw new Error('AUTH_COOKIE_MAX_AGE_SECONDS must be a positive integer');
}

module.exports = config;
