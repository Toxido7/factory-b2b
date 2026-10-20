import { ApiError } from '../../utils/ApiError.js';
import { slugify } from '../../utils/slugify.js';
import * as categoriesRepository from './categories.repository.js';

const toPublicCategory = (c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  parentId: c.parentId,
});

const assertValidParent = async (parentId) => {
  const parent = await categoriesRepository.findById(parentId);
  if (!parent) throw ApiError.badRequest('Parent category not found');
  if (parent.parentId) throw ApiError.badRequest('Only one level of subcategories is allowed');
};

export const listPublic = async () => {
  const categories = await categoriesRepository.listActive();
  return categories.map(toPublicCategory);
};

export const listAdmin = () => categoriesRepository.listAll();

export const create = async ({ name, description, parentId }) => {
  const slug = slugify(name);
  if (!slug)
    throw ApiError.badRequest('Name must contain at least one letter or number (a-z, 0-9)');

  if (parentId) await assertValidParent(parentId);

  return categoriesRepository.create({ name, slug, description, parentId });
};

export const update = async (id, changes) => {
  const category = await categoriesRepository.findById(id);
  if (!category) throw ApiError.notFound('Category not found');

  if (changes.parentId) {
    if (changes.parentId === id) throw ApiError.badRequest('A category cannot be its own parent');
    if (category._count.children > 0) {
      throw ApiError.badRequest('A category with subcategories cannot become a subcategory');
    }
    await assertValidParent(changes.parentId);
  }

  return categoriesRepository.update(id, changes);
};
