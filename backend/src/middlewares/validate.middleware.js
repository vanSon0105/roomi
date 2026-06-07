const AppError = require('../utils/app-error');

const formatIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!result.success) {
    return next(new AppError('Validation failed', 400, formatIssues(result.error.issues)));
  }

  req.validated = result.data;
  return next();
};

module.exports = validate;
