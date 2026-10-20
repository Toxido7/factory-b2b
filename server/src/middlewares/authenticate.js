import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/tokens.js';

export const authenticate = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication required');
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.auth = { userId: payload.sub, role: payload.role };
  } catch {
    throw ApiError.unauthorized('Invalid or expired token');
  }

  next();
};
