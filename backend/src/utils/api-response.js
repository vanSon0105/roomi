const sendSuccess = (res, { statusCode = 200, message = 'OK', data = null } = {}) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });

module.exports = {
  sendSuccess,
};
