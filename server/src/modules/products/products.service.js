import { ApiError } from '../../utils/ApiError.js';
import { slugify } from '../../utils/slugify.js';
import * as categoriesRepository from '../categories/categories.repository.js';
import * as productsRepository from './products.repository.js';

const assertCategoryExists = async (categoryId) => {
  const category = await categoriesRepository.findById(categoryId);
  if (!category) throw ApiError.badRequest('Category not found');
};

export const listAdmin = () => productsRepository.listAll();

export const getAdmin = async (id) => {
  const product = await productsRepository.findById(id);
  if (!product) throw ApiError.notFound('Product not found');
  return product;
};

export const create = async (data) => {
  const slug = slugify(data.name);
  if (!slug)
    throw ApiError.badRequest('Name must contain at least one letter or number (a-z, 0-9)');

  await assertCategoryExists(data.categoryId);

  return productsRepository.create({ ...data, slug });
};

export const update = async (id, changes) => {
  await getAdmin(id); // 404 if it does not exist

  if (changes.categoryId) await assertCategoryExists(changes.categoryId);

  return productsRepository.update(id, changes);
};
