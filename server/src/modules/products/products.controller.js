import * as productsService from './products.service.js';

export const listAdmin = async (req, res) => {
  const products = await productsService.listAdmin();
  res.json({ success: true, data: { products } });
};

export const getAdmin = async (req, res) => {
  const product = await productsService.getAdmin(req.validated.params.id);
  res.json({ success: true, data: { product } });
};

export const create = async (req, res) => {
  const product = await productsService.create(req.validated.body);
  res.status(201).json({ success: true, data: { product } });
};

export const update = async (req, res) => {
  const product = await productsService.update(req.validated.params.id, req.validated.body);
  res.json({ success: true, data: { product } });
};
