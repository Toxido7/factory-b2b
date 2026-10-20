import * as categoriesService from './categories.service.js';

export const listPublic = async (req, res) => {
  const categories = await categoriesService.listPublic();
  res.json({ success: true, data: { categories } });
};

export const listAdmin = async (req, res) => {
  const categories = await categoriesService.listAdmin();
  res.json({ success: true, data: { categories } });
};

export const create = async (req, res) => {
  const category = await categoriesService.create(req.validated.body);
  res.status(201).json({ success: true, data: { category } });
};

export const update = async (req, res) => {
  const category = await categoriesService.update(req.validated.params.id, req.validated.body);
  res.json({ success: true, data: { category } });
};
