import * as contentService from './content.service.js';

export const listPublic = async (req, res) => {
  const data = await contentService.listPublic();
  res.json({ success: true, data });
};

export const listAdmin = async (req, res) => {
  const data = await contentService.listAdmin();
  res.json({ success: true, data });
};

export const update = async (req, res) => {
  const data = await contentService.update(req.validated.body.values);
  res.json({ success: true, data });
};
