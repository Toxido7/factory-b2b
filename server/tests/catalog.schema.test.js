import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';

const productData = (categoryId, overrides = {}) => ({
  sku: 'GL-001',
  name: 'Work gloves',
  slug: 'work-gloves',
  price: '19.99',
  minQuantity: 50,
  categoryId,
  ...overrides,
});

describe('catalog database rules', () => {
  let category;

  beforeEach(async () => {
    await resetDb();
    category = await prisma.category.create({ data: { name: 'Gloves', slug: 'gloves' } });
  });

  it('stores the price exactly', async () => {
    const product = await prisma.product.create({ data: productData(category.id) });

    expect(product.price.toString()).toBe('19.99');
  });

  it('rejects a duplicate sku', async () => {
    await prisma.product.create({ data: productData(category.id) });

    await expect(
      prisma.product.create({ data: productData(category.id, { slug: 'other-slug' }) }),
    ).rejects.toMatchObject({ code: 'P2002' });
  });

  it('does not allow deleting a category that still has products', async () => {
    await prisma.product.create({ data: productData(category.id) });

    await expect(prisma.category.delete({ where: { id: category.id } })).rejects.toMatchObject({
      code: 'P2003',
    });
  });
});
