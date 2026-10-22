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
export const listAdmin = async (req, res) => {
  const data = await requestsService.listAdmin(req.validated.query);
  res.json({ success: true, data });
};

export const getAdmin = async (req, res) => {
  const request = await requestsService.getAdmin(req.validated.params.id);
  res.json({ success: true, data: { request } });
};

export const changeStatus = async (req, res) => {
  const request = await requestsService.changeStatus(
    req.validated.params.id,
    req.auth.userId,
    req.validated.body.status,
  );
  res.json({ success: true, data: { request } });
};
