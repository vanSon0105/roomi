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
  shippingFeeEnabled: process.env.SHIPPING_FEE_ENABLED !== 'false',
  appBaseUrl: (process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 4000}`).replace(/\/+$/, ''),
  vietqr: {
    bankId: process.env.VIETQR_BANK_ID || '',
    accountNo: process.env.VIETQR_ACCOUNT_NO || '',
    accountName: process.env.VIETQR_ACCOUNT_NAME || '',
    template: process.env.VIETQR_TEMPLATE || 'compact2',
  },
  payos: {
    clientId: process.env.PAYOS_CLIENT_ID || '',
    apiKey: process.env.PAYOS_API_KEY || '',
    checksumKey: process.env.PAYOS_CHECKSUM_KEY || '',
    partnerCode: process.env.PAYOS_PARTNER_CODE || '',
    webhookUrl: process.env.PAYOS_WEBHOOK_URL || '',
    returnUrl: process.env.PAYOS_RETURN_URL || '',
    cancelUrl: process.env.PAYOS_CANCEL_URL || '',
  },
  sepay: {
    webhookApiKey: process.env.SEPAY_WEBHOOK_API_KEY || '',
    webhookUrl: process.env.SEPAY_WEBHOOK_URL || '',
    accountNo: process.env.SEPAY_ACCOUNT_NO || '',
    accountName: process.env.SEPAY_ACCOUNT_NAME || '',
    qrBankName: process.env.SEPAY_QR_BANK_NAME || 'VietinBank',
    qrBaseUrl: (process.env.SEPAY_QR_BASE_URL || 'https://qr.sepay.vn/img').replace(/\/+$/, ''),
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

// Merge DB settings into config (DB overrides .env when set)
const syncFromDb = async () => {
  try {
    const prisma = require('./prisma');
    const settings = await prisma.setting.findMany();
    const map = {};
    for (const s of settings) {
      if (s.value) map[s.key] = s.value;
    }

    if (map.payos_client_id) config.payos.clientId = map.payos_client_id;
    if (map.payos_api_key) config.payos.apiKey = map.payos_api_key;
    if (map.payos_checksum_key) config.payos.checksumKey = map.payos_checksum_key;
    if (map.sepay_account_no) config.sepay.accountNo = map.sepay_account_no;
    if (map.sepay_account_name) config.sepay.accountName = map.sepay_account_name;
    if (map.sepay_qr_bank_name) config.sepay.qrBankName = map.sepay_qr_bank_name;
    if (map.shipping_fee_enabled !== undefined) config.shippingFeeEnabled = map.shipping_fee_enabled !== 'false';
  } catch (_error) {
    // DB not ready yet (first migration) — ignore
  }
};

module.exports = config;
module.exports.syncFromDb = syncFromDb;
