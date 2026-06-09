const prisma = require('../../config/prisma');

const withClient = (client) => client || prisma;

const findAll = (client) =>
  withClient(client).setting.findMany({
    orderBy: { key: 'asc' },
  });

const findByKey = (key, client) =>
  withClient(client).setting.findUnique({
    where: { key },
  });

const upsert = (key, value, client) =>
  withClient(client).setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

module.exports = {
  findAll,
  findByKey,
  upsert,
};
