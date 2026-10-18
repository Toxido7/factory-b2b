import { ApiError } from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body ?? {},
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    // Build { "body.email": ["message"], "body.quantity": ["message"] }
    const details = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join('.') || 'request';
      (details[field] ??= []).push(issue.message);
    }
    return next(ApiError.badRequest('Validation failed', details));
  }

  req.validated = result.data;
  next();
};
