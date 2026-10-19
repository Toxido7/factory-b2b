import { env } from '../../config/env.js';

export const REFRESH_COOKIE = 'refresh_token';

const baseOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
});

export const setRefreshCookie = (res, token) =>
  res.cookie(REFRESH_COOKIE, token, {
    ...baseOptions(),
    maxAge: env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  });

export const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, baseOptions());
