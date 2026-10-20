import * as authService from './auth.service.js';
import { ApiError } from '../../utils/ApiError.js';
import { REFRESH_COOKIE, setRefreshCookie, clearRefreshCookie } from './auth.cookies.js';
export const register = async (req, res) => {
  const user = await authService.register(req.validated.body);

  res.status(201).json({ success: true, data: { user } });
};

export const login = async (req, res) => {
  const meta = { userAgent: req.get('user-agent'), ip: req.ip };
  const { user, accessToken, refreshToken } = await authService.login(req.validated.body, meta);

  setRefreshCookie(res, refreshToken);
  res.json({ success: true, data: { user, accessToken } });
};
export const refresh = async (req, res) => {
  const meta = { userAgent: req.get('user-agent'), ip: req.ip };

  try {
    const { user, accessToken, refreshToken } = await authService.refresh(
      req.cookies?.[REFRESH_COOKIE],
      meta,
    );

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, data: { user, accessToken } });
  } catch (err) {
    // A rejected token is useless: make the browser forget it
    if (err instanceof ApiError) clearRefreshCookie(res);
    throw err;
  }
};
export const logout = async (req, res) => {
  try {
    await authService.logout(req.cookies?.refresh_token);
  } finally {
    clearRefreshCookie(res);
  }
  res.json({ success: true, data: { message: 'Logged out' } });
};
export const me = async (req, res) => {
  const user = await authService.getMe(req.auth.userId);
  res.json({ success: true, data: { user } });
};
