const compression = require('compression');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const config = require('./config/env');
const apiRoutes = require('./routes');
const {
  errorHandler,
  notFoundHandler,
} = require('./middlewares/error.middleware');
const pageAccessMiddleware = require('./middlewares/page-access.middleware');

const app = express();
const frontendPath = path.resolve(__dirname, '..', '..', 'frontend');

app.disable('x-powered-by');
app.use(compression());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'upgrade-insecure-requests': null,
        'script-src': ["'self'", 'https://unpkg.com', 'https://esm.sh'],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://unpkg.com',
          'https://cdn.jsdelivr.net',
        ],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:', 'https://img.vietqr.io', 'https://qr.sepay.vn'],
      },
    },
  }),
);
app.use(
  cors({
    origin:
      config.corsOrigin === '*'
        ? true
        : config.corsOrigin.split(',').map((origin) => origin.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', apiRoutes);
app.use(pageAccessMiddleware);
app.use(
  express.static(frontendPath, {
    maxAge: '7d',
    etag: true,
    setHeaders: (res, filePath) => {
      const extension = path.extname(filePath).toLowerCase();
      const normalizedPath = filePath.split(path.sep).join('/');
      const isAdminScript =
        extension === '.js' && normalizedPath.includes('/frontend/assets/js/admin');

      if (extension === '.html' || isAdminScript) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.get('/', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
