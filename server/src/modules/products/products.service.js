import { ApiError } from '../../utils/ApiError.js';
import { slugify } from '../../utils/slugify.js';
import { Prisma } from '@prisma/client';
import { detectImageType } from '../../utils/imageType.js';
import { saveImage, deleteImage } from '../../utils/imageStorage.js';
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
// price * (100 - discount) / 100, exact, 2 decimals, returned as a string
const toPublicProduct = (product) => {
  const factor = new Prisma.Decimal(100).minus(product.discountPercent);
  const finalPrice = product.price.mul(factor).div(100).toDecimalPlaces(2);
  return { ...product, finalPrice: finalPrice.toFixed(2) };
};

export const listPublic = async (query) => {
  const { products, total } = await productsRepository.listPublic(query);
  return {
    products: products.map(toPublicProduct),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
};

export const getPublicBySlug = async (slug) => {
  const product = await productsRepository.findPublicBySlug(slug);
  if (!product) throw ApiError.notFound('Product not found');
  return toPublicProduct(product);
};
const MAX_IMAGES = 5;
const toUrl = (filename) => `/uploads/${filename}`;

export const addImage = async (id, file) => {
  if (!file) throw ApiError.badRequest('Image file is required (field "image")');

  const ext = detectImageType(file.buffer);
  if (!ext) throw ApiError.badRequest('Only JPEG, PNG or WebP images are allowed');

  const product = await getAdmin(id); // 404 if unknown
  if (product.images.length >= MAX_IMAGES) {
    throw ApiError.badRequest(`A product can have at most ${MAX_IMAGES} images`);
  }

  const filename = await saveImage(file.buffer, ext);
  try {
    return await productsRepository.update(id, { images: [...product.images, toUrl(filename)] });
  } catch (err) {
    await deleteImage(filename); // do not leave an orphan file
    throw err;
  }
};

export const removeImage = async (id, filename) => {
  const product = await getAdmin(id);
  const url = toUrl(filename);
  if (!product.images.includes(url)) throw ApiError.notFound('Image not found');

  const updated = await productsRepository.update(id, {
    images: product.images.filter((image) => image !== url),
  });
  await deleteImage(filename);
  return updated;
};
