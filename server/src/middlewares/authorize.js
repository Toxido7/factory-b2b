import { ApiError } from '../utils/ApiError.js';

export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.auth) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (!allowedRoles.includes(req.auth.role)) {
      throw ApiError.forbidden('You do not have permission to do this');
    }

    next();
  };
