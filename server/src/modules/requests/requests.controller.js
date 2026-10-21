import * as requestsService from './requests.service.js';

export const create = async (req, res) => {
  const request = await requestsService.create(req.auth.userId, req.validated.body);
  res.status(201).json({ success: true, data: { request } });
};
