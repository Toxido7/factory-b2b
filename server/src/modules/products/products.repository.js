import { prisma } from '../../config/prisma.js';

const withCategory = { category: { select: { id: true, name: true, slug: true } } };

export const create = (data) => prisma.product.create({ data, include: withCategory });

export const findById = (id) => prisma.product.findUnique({ where: { id }, include: withCategory });

export const listAll = () =>
  prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: withCategory });

export const update = (id, data) =>
  prisma.product.update({ where: { id }, data, include: withCategory });
const publicSelect = {
  id: true,
  sku: true,
  name: true,
  slug: true,
  description: true,
  images: true,
  price: true,
  minQuantity: true,
  discountPercent: true,
  category: { select: { name: true, slug: true } },
};

const orderByMap = {
  newest: { createdAt: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  name: { name: 'asc' },
};

export const listPublic = async ({ page, limit, q, category, minPrice, maxPrice, sort }) => {
  const where = {
    isActive: true,
    // a product is visible only if its category is active
    // (and, when filtering, the category itself OR its parent matches the slug)
    category: {
      isActive: true,
      ...(category && { OR: [{ slug: category }, { parent: { slug: category } }] }),
    },
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const price = {};
  if (minPrice !== undefined) price.gte = minPrice;
  if (maxPrice !== undefined) price.lte = maxPrice;
  if (Object.keys(price).length) where.price = price;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: publicSelect,
      orderBy: [orderByMap[sort], { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total };
};

export const findPublicBySlug = (slug) =>
  prisma.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true } },
    select: publicSelect,
  });
