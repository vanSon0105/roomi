const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config/env');
const apiRoutes = require('./routes');
const {
  errorHandler,
  notFoundHandler,
} = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');

app.use(helmet());
app.use(
  cors({
    origin:
      config.corsOrigin === '*'
        ? '*'
        : config.corsOrigin.split(',').map((origin) => origin.trim()),
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
