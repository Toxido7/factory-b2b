import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';

beforeEach(async () => {
  await resetDb();
});

const createBase = async () => {
  const user = await prisma.user.create({
    data: { email: 'buyer@test.com', passwordHash: 'x', fullName: 'Buyer' },
  });
  const category = await prisma.category.create({ data: { name: 'Gloves', slug: 'gloves' } });
  const product = await prisma.product.create({
    data: { sku: 'G-1', name: 'Glove', slug: 'glove', price: '100.00', categoryId: category.id },
  });
  return { user, product };
};

// 10 x (100 - 15%) = 850.00
const createRequest = (userId, productId) =>
  prisma.orderRequest.create({
    data: {
      customerName: 'Buyer',
      customerEmail: 'buyer@test.com',
      estimatedTotal: '850.00',
      userId,
      items: {
        create: [
          {
            productId,
            productName: 'Glove',
            sku: 'G-1',
            unitPrice: '100.00',
            discountPercent: '15.00',
            quantity: 10,
            lineTotal: '850.00',
          },
        ],
      },
    },
    include: { items: true },
  });

describe('order request models', () => {
  it('defaults to PENDING and numbers keep increasing', async () => {
    const { user, product } = await createBase();
    const first = await createRequest(user.id, product.id);
    const second = await createRequest(user.id, product.id);
    expect(first.status).toBe('PENDING');
    expect(second.number).toBeGreaterThan(first.number);
  });

  it('stores money exactly', async () => {
    const { user, product } = await createBase();
    const request = await createRequest(user.id, product.id);
    expect(Number(request.estimatedTotal)).toBe(850);
    expect(Number(request.items[0].lineTotal)).toBe(850);
    expect(Number(request.items[0].discountPercent)).toBe(15);
  });

  it('deletes the items when the request is deleted', async () => {
    const { user, product } = await createBase();
    const request = await createRequest(user.id, product.id);
    await prisma.orderRequest.delete({ where: { id: request.id } });
    expect(await prisma.requestItem.count()).toBe(0);
  });

  it('does not allow deleting a user who has requests', async () => {
    const { user, product } = await createBase();
    await createRequest(user.id, product.id);
    await expect(prisma.user.delete({ where: { id: user.id } })).rejects.toMatchObject({
      code: 'P2003',
    });
  });

  it('does not allow deleting a product used in a request', async () => {
    const { user, product } = await createBase();
    await createRequest(user.id, product.id);
    await expect(prisma.product.delete({ where: { id: product.id } })).rejects.toMatchObject({
      code: 'P2003',
    });
  });
});
