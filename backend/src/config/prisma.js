const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

const config = require('./env');

const adapter = new PrismaMariaDb(config.databaseUrl);
const prisma = new PrismaClient({
  adapter,
});

module.exports = prisma;
