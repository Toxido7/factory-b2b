import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { formatReference } from '../src/utils/reference.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';

let product;
let other;
let me;
let token;

beforeEach(async () => {
  await resetDb();
  const category = await prisma.category.create({ data: { name: 'Gloves', slug: 'gloves' } });
  product = await prisma.product.create({
    data: { sku: 'G-1', name: 'Glove', slug: 'glove', price: '100.00', categoryId: category.id },
  });
  other = await prisma.user.create({
    data: { email: 'other@test.com', passwordHash: 'x', fullName: 'Other' },
  });
  token = await userToken();
  me = await prisma.user.findFirst({ where: { email: { not: other.email } } });
});

const createRequestFor = (userId, extra = {}) =>
  prisma.orderRequest.create({
    data: {
      customerName: 'Buyer',
      customerEmail: 'buyer@test.com',
      estimatedTotal: '850.00',
      userId,
      items: {
        create: [
          {
            productId: product.id,
            productName: 'Glove',
            sku: 'G-1',
            unitPrice: '100.00',
            discountPercent: '15.00',
            quantity: 10,
            lineTotal: '850.00',
          },
        ],
      },
      ...extra,
    },
  });

const getMine = (path = '') =>
  request(app).get(`/api/requests/mine${path}`).set('Authorization', `Bearer ${token}`);

describe('GET /api/requests/mine', () => {
  it('lists only my requests', async () => {
    await createRequestFor(me.id);
    await createRequestFor(me.id);
    await createRequestFor(other.id);

    const res = await getMine();
    expect(res.status).toBe(200);
    expect(res.body.data.requests).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  it('shows the newest first', async () => {
    const older = await createRequestFor(me.id, { createdAt: new Date('2026-01-01T10:00:00Z') });
    const newer = await createRequestFor(me.id, { createdAt: new Date('2026-02-01T10:00:00Z') });

    const res = await getMine();
    expect(res.body.data.requests.map((r) => r.reference)).toEqual([
      formatReference(newer.number, newer.createdAt),
      formatReference(older.number, older.createdAt),
    ]);
  });

  it('paginates', async () => {
    await createRequestFor(me.id);
    await createRequestFor(me.id);
    await createRequestFor(me.id);

    const res = await getMine('?limit=2&page=2');
    expect(res.body.data.requests).toHaveLength(1);
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('filters by status', async () => {
    await createRequestFor(me.id);
    await createRequestFor(me.id, { status: 'CONFIRMED' });

    const res = await getMine('?status=CONFIRMED');
    expect(res.body.data.requests).toHaveLength(1);
    expect(res.body.data.requests[0].status).toBe('CONFIRMED');
  });

  it('rejects an unknown status', async () => {
    const res = await getMine('?status=banana');
    expect(res.status).toBe(400);
  });

  it('returns a summary without the items', async () => {
    await createRequestFor(me.id);

    const res = await getMine();
    const summary = res.body.data.requests[0];
    expect(summary.estimatedTotal).toBe('850.00');
    expect(summary.itemCount).toBe(1);
    expect(summary).not.toHaveProperty('items');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/requests/mine');
    expect(res.status).toBe(401);
  });

  it('returns 403 for an admin', async () => {
    const res = await request(app)
      .get('/api/requests/mine')
      .set('Authorization', `Bearer ${await adminToken()}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/requests/mine/:id', () => {
  it('returns my request with its items', async () => {
    const created = await createRequestFor(me.id);

    const res = await getMine(`/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.request.reference).toBe(
      formatReference(created.number, created.createdAt),
    );
    expect(res.body.data.request.items).toHaveLength(1);
    expect(res.body.data.request.items[0].lineTotal).toBe('850.00');
  });

  it('returns 404 for a request of another user', async () => {
    const theirs = await createRequestFor(other.id);
    const res = await getMine(`/${theirs.id}`);
    expect(res.status).toBe(404);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await getMine('/00000000-0000-4000-8000-000000000000');
    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid id', async () => {
    const res = await getMine('/not-a-uuid');
    expect(res.status).toBe(400);
  });
});
