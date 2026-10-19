import { setRefreshCookie } from './auth.cookies.js';
import * as authService from './auth.service.js';

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
