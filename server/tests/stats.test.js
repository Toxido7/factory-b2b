import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const RANGE = 'from=2026-03-01&to=2026-03-31';
const at = (day) => new Date(`${day}T12:00:00Z`);

const makeCustomer = (email, extra = {}) =>
  prisma.user.create({
    data: {
      email,
      passwordHash: 'not-a-real-hash',
      fullName: email.split('@')[0],
      ...extra,
    },
  });

const makeProduct = async (sku, name) => {
  const category = await prisma.category.upsert({
    where: { slug: 'stats-cat' },
    update: {},
    create: { name: 'Stats Cat', slug: 'stats-cat' },
  });
  return prisma.product.create({
    data: { sku, name, slug: name.toLowerCase(), price: 10, categoryId: category.id },
  });
};

// Every item has a unit price of 10, so lineTotal = quantity * 10
const makeRequest = ({
  user,
  status = 'PENDING',
  createdAt = at('2026-03-10'),
  items = [],
  total,
}) =>
  prisma.orderRequest.create({
    data: {
      userId: user.id,
      customerName: user.fullName,
      customerEmail: user.email,
      status,
      createdAt,
      estimatedTotal: total ?? items.reduce((sum, i) => sum + i.quantity * 10, 0),
      items: {
        create: items.map(({ product, quantity }) => ({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: 10,
          discountPercent: 0,
          quantity,
          lineTotal: quantity * 10,
        })),
      },
    },
  });

const get = (token, path) => request(app).get(`/api/admin/stats/${path}`).set(auth(token));

beforeEach(async () => {
  await resetDb();
});

describe('GET /api/admin/stats/overview', () => {
  it('returns totals, status breakdown and conversion rate', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    await makeRequest({ user: ali, status: 'PENDING' });
    await makeRequest({ user: ali, status: 'CONFIRMED' });
    await makeRequest({ user: ali, status: 'REJECTED' });
    await makeRequest({ user: ali, createdAt: at('2026-02-10') }); // outside the range

    const res = await get(token, `overview?${RANGE}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      range: { from: '2026-03-01', to: '2026-03-31' },
      totalRequests: 3,
      conversionRate: 33.3,
      byStatus: { PENDING: 1, CONTACTED: 0, CONFIRMED: 1, REJECTED: 1, CANCELLED: 0 },
    });
  });

  it('returns zeros when there are no requests', async () => {
    const token = await adminToken();

    const res = await get(token, `overview?${RANGE}`);

    expect(res.body.data).toMatchObject({ totalRequests: 0, conversionRate: 0, newCustomers: 0 });
  });

  it('counts only new customers (role USER) created in the range', async () => {
    const token = await adminToken();
    await makeCustomer('a@example.com', { createdAt: at('2026-03-05') });
    await makeCustomer('b@example.com', { createdAt: at('2026-03-20') });
    await makeCustomer('c@example.com', { createdAt: at('2026-04-02') });
    await makeCustomer('boss@example.com', { role: 'ADMIN', createdAt: at('2026-03-06') });

    const res = await get(token, `overview?${RANGE}`);

    expect(res.body.data.newCustomers).toBe(2);
  });

  it('includes the whole last day and excludes the next one', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    await makeRequest({ user: ali, createdAt: new Date('2026-03-31T23:30:00Z') });
    await makeRequest({ user: ali, createdAt: new Date('2026-04-01T00:00:00Z') });

    const res = await get(token, `overview?${RANGE}`);

    expect(res.body.data.totalRequests).toBe(1);
  });

  it('uses the last 30 days when no dates are given', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    await makeRequest({ user: ali, createdAt: new Date() });

    const res = await get(token, 'overview');

    expect(res.status).toBe(200);
    expect(res.body.data.totalRequests).toBe(1);
  });

  it.each([
    'from=2026-02-31',
    'from=hello',
    'from=2026-03-10&to=2026-03-01',
    'from=2020-01-01&to=2026-03-01',
  ])('returns 400 for ?%s', async (query) => {
    const token = await adminToken();

    const res = await get(token, `overview?${query}`);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/stats/requests-over-time', () => {
  it('counts requests per day and fills empty days with 0', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    await makeRequest({ user: ali, createdAt: at('2026-03-01') });
    await makeRequest({ user: ali, createdAt: new Date('2026-03-01T20:00:00Z') });
    await makeRequest({ user: ali, createdAt: at('2026-03-03') });

    const res = await get(token, 'requests-over-time?from=2026-03-01&to=2026-03-04');

    expect(res.body.data.interval).toBe('day');
    expect(res.body.data.series).toEqual([
      { period: '2026-03-01', count: 2 },
      { period: '2026-03-02', count: 0 },
      { period: '2026-03-03', count: 1 },
      { period: '2026-03-04', count: 0 },
    ]);
  });

  it('groups by month when interval=month', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    await makeRequest({ user: ali, createdAt: at('2026-01-15') });
    await makeRequest({ user: ali, createdAt: at('2026-01-20') });
    await makeRequest({ user: ali, createdAt: at('2026-02-10') });

    const res = await get(token, 'requests-over-time?from=2026-01-01&to=2026-03-31&interval=month');

    expect(res.body.data.series).toEqual([
      { period: '2026-01', count: 2 },
      { period: '2026-02', count: 1 },
      { period: '2026-03', count: 0 },
    ]);
  });

  it('returns 400 for an unknown interval', async () => {
    const token = await adminToken();

    const res = await get(token, 'requests-over-time?interval=week');

    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/stats/top-products', () => {
  it('ranks products by total quantity', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    const sara = await makeCustomer('sara@example.com');
    const gloves = await makeProduct('GLV-1', 'Gloves');
    const helmet = await makeProduct('HLM-1', 'Helmet');
    const boots = await makeProduct('BTS-1', 'Boots');
    await makeRequest({
      user: ali,
      status: 'CONFIRMED',
      items: [
        { product: gloves, quantity: 10 },
        { product: helmet, quantity: 5 },
      ],
    });
    await makeRequest({
      user: sara,
      items: [
        { product: gloves, quantity: 20 },
        { product: boots, quantity: 1 },
      ],
    });

    const res = await get(token, `top-products?${RANGE}`);
    const { products } = res.body.data;

    expect(products.map((p) => p.name)).toEqual(['Gloves', 'Helmet', 'Boots']);
    expect(products[0]).toMatchObject({
      productId: gloves.id,
      sku: 'GLV-1',
      quantity: 30,
      estimatedValue: '300.00',
      requestCount: 2,
    });
  });

  it('ignores REJECTED and CANCELLED requests', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    const gloves = await makeProduct('GLV-1', 'Gloves');
    const helmet = await makeProduct('HLM-1', 'Helmet');
    await makeRequest({
      user: ali,
      status: 'REJECTED',
      items: [{ product: gloves, quantity: 100 }],
    });
    await makeRequest({
      user: ali,
      status: 'CANCELLED',
      items: [{ product: gloves, quantity: 100 }],
    });
    await makeRequest({
      user: ali,
      status: 'CONFIRMED',
      items: [{ product: helmet, quantity: 1 }],
    });

    const res = await get(token, `top-products?${RANGE}`);

    expect(res.body.data.products.map((p) => p.name)).toEqual(['Helmet']);
  });

  it('respects the limit', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    const gloves = await makeProduct('GLV-1', 'Gloves');
    const helmet = await makeProduct('HLM-1', 'Helmet');
    const boots = await makeProduct('BTS-1', 'Boots');
    await makeRequest({
      user: ali,
      items: [
        { product: gloves, quantity: 3 },
        { product: helmet, quantity: 2 },
        { product: boots, quantity: 1 },
      ],
    });

    const res = await get(token, `top-products?${RANGE}&limit=2`);

    expect(res.body.data.products.map((p) => p.name)).toEqual(['Gloves', 'Helmet']);
  });

  it('returns 400 for a limit of 0 or 51', async () => {
    const token = await adminToken();

    expect((await get(token, 'top-products?limit=0')).status).toBe(400);
    expect((await get(token, 'top-products?limit=51')).status).toBe(400);
  });
});

describe('GET /api/admin/stats/top-customers', () => {
  it('ranks customers by number of requests', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com', { companyName: 'Steel Co' });
    const sara = await makeCustomer('sara@example.com');
    await makeRequest({ user: ali, status: 'CONFIRMED', total: 100 });
    await makeRequest({ user: ali, status: 'PENDING', total: 50 });
    await makeRequest({ user: sara, total: 500 });

    const res = await get(token, `top-customers?${RANGE}`);
    const { customers } = res.body.data;

    expect(customers.map((c) => c.email)).toEqual(['ali@example.com', 'sara@example.com']);
    expect(customers[0]).toMatchObject({
      userId: ali.id,
      fullName: 'ali',
      companyName: 'Steel Co',
      requestCount: 2,
      estimatedTotal: '150.00',
    });
  });

  it('ignores REJECTED and CANCELLED requests', async () => {
    const token = await adminToken();
    const ali = await makeCustomer('ali@example.com');
    await makeRequest({ user: ali, status: 'CANCELLED', total: 100 });

    const res = await get(token, `top-customers?${RANGE}`);

    expect(res.body.data.customers).toEqual([]);
  });
});

describe('guards', () => {
  const routes = [
    ['GET', '/api/admin/stats/overview'],
    ['GET', '/api/admin/stats/requests-over-time'],
    ['GET', '/api/admin/stats/top-products'],
    ['GET', '/api/admin/stats/top-customers'],
  ];

  it.each(routes)('%s %s returns 401 without a token', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path);
    expect(res.status).toBe(401);
  });

  it.each(routes)('%s %s returns 403 for a normal user', async (method, path) => {
    const token = await userToken();
    const res = await request(app)[method.toLowerCase()](path).set(auth(token));
    expect(res.status).toBe(403);
  });
});
