import * as requestsService from './requests.service.js';

export const create = async (req, res) => {
  const request = await requestsService.create(req.auth.userId, req.validated.body);
  res.status(201).json({ success: true, data: { request } });
};
export const listMine = async (req, res) => {
  const data = await requestsService.listMine(req.auth.userId, req.validated.query);
  res.json({ success: true, data });
};

export const getMine = async (req, res) => {
  const request = await requestsService.getMine(req.auth.userId, req.validated.params.id);
  res.json({ success: true, data: { request } });
};
