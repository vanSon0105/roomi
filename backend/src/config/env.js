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
  corsOrigin: process.env.CORS_ORIGIN || '*',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
};

if (!Number.isInteger(config.port) || config.port <= 0) {
  throw new Error('PORT must be a positive number');
}

if (!Number.isInteger(config.bcryptSaltRounds) || config.bcryptSaltRounds < 8) {
  throw new Error('BCRYPT_SALT_ROUNDS must be an integer greater than or equal to 8');
}

module.exports = config;
