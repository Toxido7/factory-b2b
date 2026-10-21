import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';

let category;
let n = 0;

beforeEach(async () => {
  await resetDb();
  category = await prisma.category.create({ data: { name: 'Gloves', slug: 'gloves' } });
});

const makeProduct = (data = {}) => {
  n += 1;
  return prisma.product.create({
    data: {
      sku: `P-${n}`,
      name: `Product ${n}`,
      slug: `product-${n}`,
      price: '100.00',
      minQuantity: 5,
      categoryId: category.id,
      ...data,
    },
  });
};

// a logged-in user whose email is verified
const verifiedToken = async () => {
  const token = await userToken();
  await prisma.user.updateMany({ data: { emailVerified: true } });
  return token;
};

const send = (token, body) =>
  request(app).post('/api/requests').set('Authorization', `Bearer ${token}`).send(body);

describe('POST /api/requests', () => {
  it('creates a request with totals calculated by the server', async () => {
    const token = await verifiedToken();
    const product = await makeProduct({ discountPercent: '15.00' });

    const res = await send(token, { items: [{ productId: product.id, quantity: 10 }] });

    expect(res.status).toBe(201);
    const created = res.body.data.request;
    expect(created.reference).toMatch(/^REQ-\d{4}-\d{5}$/);
    expect(created.status).toBe('PENDING');
    expect(created.items[0].unitPrice).toBe('100.00');
    expect(created.items[0].lineTotal).toBe('850.00');
    expect(created.estimatedTotal).toBe('850.00');
  });

  it('adds several items with exact rounding', async () => {
    const token = await verifiedToken();
    const a = await makeProduct({ sku: 'A-1', slug: 'a-1', name: 'A', price: '10.00' });
    const b = await makeProduct({
      sku: 'B-1',
      slug: 'b-1',
      name: 'B',
      price: '19.99',
      discountPercent: '12.50',
    });

    const res = await send(token, {
      items: [
        { productId: a.id, quantity: 5 },
        { productId: b.id, quantity: 6 },
      ],
    });

    const items = res.body.data.request.items;
    expect(items.find((i) => i.sku === 'A-1').lineTotal).toBe('50.00');
    expect(items.find((i) => i.sku === 'B-1').lineTotal).toBe('104.94');
    expect(res.body.data.request.estimatedTotal).toBe('154.94');
  });

  it('saves a snapshot of the customer and the product', async () => {
    const token = await verifiedToken();
    const product = await makeProduct({ discountPercent: '15.00' });
    await send(token, { items: [{ productId: product.id, quantity: 10 }] });

    await prisma.product.update({
      where: { id: product.id },
      data: { price: '999.00', name: 'Renamed' },
    });

    const saved = await prisma.orderRequest.findFirst({ include: { items: true } });
    const user = await prisma.user.findFirst();
    expect(Number(saved.items[0].unitPrice)).toBe(100);
    expect(saved.items[0].productName).not.toBe('Renamed');
    expect(saved.customerEmail).toBe(user.email);
  });

  it('ignores prices sent by the client', async () => {
    const token = await verifiedToken();
    const product = await makeProduct({ discountPercent: '15.00' });

    const res = await send(token, {
      estimatedTotal: 1,
      items: [{ productId: product.id, quantity: 10, price: 1, unitPrice: 1 }],
    });

    expect(res.status).toBe(201);
    expect(res.body.data.request.estimatedTotal).toBe('850.00');
  });

  it('rejects a quantity below the minimum', async () => {
    const token = await verifiedToken();
    const product = await makeProduct({ minQuantity: 20 });
    const res = await send(token, { items: [{ productId: product.id, quantity: 19 }] });
    expect(res.status).toBe(400);
  });

  it('rejects an inactive product', async () => {
    const token = await verifiedToken();
    const product = await makeProduct({ isActive: false });
    const res = await send(token, { items: [{ productId: product.id, quantity: 10 }] });
    expect(res.status).toBe(400);
  });

  it('rejects a product in a hidden category', async () => {
    const token = await verifiedToken();
    const product = await makeProduct();
    await prisma.category.update({ where: { id: category.id }, data: { isActive: false } });
    const res = await send(token, { items: [{ productId: product.id, quantity: 10 }] });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown product', async () => {
    const token = await verifiedToken();
    const res = await send(token, {
      items: [{ productId: '00000000-0000-4000-8000-000000000000', quantity: 10 }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects an empty items list', async () => {
    const token = await verifiedToken();
    const res = await send(token, { items: [] });
    expect(res.status).toBe(400);
  });

  it('rejects duplicate products', async () => {
    const token = await verifiedToken();
    const product = await makeProduct();
    const res = await send(token, {
      items: [
        { productId: product.id, quantity: 5 },
        { productId: product.id, quantity: 5 },
      ],
    });
    expect(res.status).toBe(400);
  });

  it('returns 403 when the email is not verified', async () => {
    const token = await userToken();
    await prisma.user.updateMany({ data: { emailVerified: false } });
    const product = await makeProduct();
    const res = await send(token, { items: [{ productId: product.id, quantity: 10 }] });
    expect(res.status).toBe(403);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/requests').send({ items: [] });
    expect(res.status).toBe(401);
  });

  it('returns 403 for an admin', async () => {
    const product = await makeProduct();
    const res = await send(await adminToken(), {
      items: [{ productId: product.id, quantity: 10 }],
    });
    expect(res.status).toBe(403);
  });
});
