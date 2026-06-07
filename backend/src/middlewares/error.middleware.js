const { Prisma } = require('@prisma/client');

const AppError = require('../utils/app-error');

const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

const errorHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let data = error.details || null;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      statusCode = 409;
      message = 'Resource already exists';
      data = null;
    }

    if (error.code === 'P2025') {
      statusCode = 404;
      message = 'Resource not found';
      data = null;
    }
  }

  if (statusCode >= 500) {
    message = 'Internal server error';
    data = null;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data,
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
