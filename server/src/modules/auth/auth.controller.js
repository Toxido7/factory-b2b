import * as authService from './auth.service.js';

export const register = async (req, res) => {
  const user = await authService.register(req.validated.body);

  res.status(201).json({ success: true, data: { user } });
};
