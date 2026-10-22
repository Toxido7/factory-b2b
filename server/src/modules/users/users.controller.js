import * as usersService from './users.service.js';

export const list = async (req, res) => {
  const data = await usersService.listUsers(req.validated.query);
  res.json({ success: true, data });
};

export const getOne = async (req, res) => {
  const user = await usersService.getUser(req.validated.params.id);
  res.json({ success: true, data: { user } });
};

export const setStatus = async (req, res) => {
  const user = await usersService.setUserStatus({
    id: req.validated.params.id,
    isActive: req.validated.body.isActive,
    adminId: req.auth.userId,
  });
  res.json({ success: true, data: { user } });
};
