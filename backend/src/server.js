const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');

const start = async () => {
  await config.syncFromDb();
  console.log('Settings synced from DB');

  const server = app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
  });

  const shutdown = async () => {
    await prisma.$disconnect();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

start();
