import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { formatReference } from '../src/utils/reference.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';

let product;
let buyer;
let token;

beforeEach(async () => {
  await resetDb();
  const category = await prisma.category.create({ data: { name: 'Gloves', slug: 'gloves' } });
  product = await prisma.product.create({
    data: { sku: 'G-1', name: 'Glove', slug: 'glove', price: '100.00', categoryId: category.id },
  });
  buyer = await prisma.user.create({
    data: { email: 'buyer@test.com', passwordHash: 'x', fullName: 'Buyer' },
  });
  token = await adminToken();
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

const asAdmin = (req) => req.set('Authorization', `Bearer ${token}`);
const list = (query = '') => asAdmin(request(app).get(`/api/admin/requests${query}`));
const detail = (id) => asAdmin(request(app).get(`/api/admin/requests/${id}`));
const setStatus = (id, status) =>
  asAdmin(request(app).patch(`/api/admin/requests/${id}/status`)).send({ status });

describe('GET /api/admin/requests', () => {
  it('lists the requests of all customers', async () => {
    const second = await prisma.user.create({
      data: { email: 'second@test.com', passwordHash: 'x', fullName: 'Second' },
    });
    await createRequestFor(buyer.id);
    await createRequestFor(second.id, { customerEmail: 'second@test.com' });

    const res = await list();
    expect(res.status).toBe(200);
    expect(res.body.data.requests).toHaveLength(2);
    expect(res.body.data.requests.map((r) => r.customerEmail).sort()).toEqual([
      'buyer@test.com',
      'second@test.com',
    ]);
  });

  it('filters by status', async () => {
    await createRequestFor(buyer.id);
    await createRequestFor(buyer.id, { status: 'CONFIRMED' });

    const res = await list('?status=CONFIRMED');
    expect(res.body.data.requests).toHaveLength(1);
    expect(res.body.data.requests[0].status).toBe('CONFIRMED');
  });

  it('searches by customer name, case-insensitive', async () => {
    await createRequestFor(buyer.id, { customerName: 'Acme Corp' });
    await createRequestFor(buyer.id, { customerName: 'Other Ltd' });

    const res = await list('?q=ACME');
    expect(res.body.data.requests).toHaveLength(1);
    expect(res.body.data.requests[0].customerName).toBe('Acme Corp');
  });

  it('searches by reference', async () => {
    const target = await createRequestFor(buyer.id);
    await createRequestFor(buyer.id);

    const res = await list(`?q=${formatReference(target.number, target.createdAt)}`);
    expect(res.body.data.requests).toHaveLength(1);
    expect(res.body.data.requests[0].id).toBe(target.id);
  });

  it('paginates', async () => {
    await createRequestFor(buyer.id);
    await createRequestFor(buyer.id);
    await createRequestFor(buyer.id);

    const res = await list('?limit=2&page=2');
    expect(res.body.data.requests).toHaveLength(1);
    expect(res.body.data.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('rejects an unknown status filter', async () => {
    const res = await list('?status=banana');
    expect(res.status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/admin/requests');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a normal user', async () => {
    const res = await request(app)
      .get('/api/admin/requests')
      .set('Authorization', `Bearer ${await userToken()}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/requests/:id', () => {
  it('returns the customer, the items and the email status', async () => {
    const created = await createRequestFor(buyer.id);

    const res = await detail(created.id);
    expect(res.status).toBe(200);
    expect(res.body.data.request.customerEmail).toBe('buyer@test.com');
    expect(res.body.data.request.items).toHaveLength(1);
    expect(res.body.data.request.emailSentAt).toBeNull();
    expect(res.body.data.request.handledBy).toBeNull();
  });

  it('returns 404 for an unknown id', async () => {
    const res = await detail('00000000-0000-4000-8000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/admin/requests/:id/status', () => {
  it('changes the status and records the admin', async () => {
    const created = await createRequestFor(buyer.id);
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    const res = await setStatus(created.id, 'CONTACTED');
    expect(res.status).toBe(200);
    expect(res.body.data.request.status).toBe('CONTACTED');
    expect(res.body.data.request.handledBy.id).toBe(admin.id);
  });

  it('allows the path PENDING, CONTACTED, CONFIRMED', async () => {
    const created = await createRequestFor(buyer.id);
    await setStatus(created.id, 'CONTACTED');

    const res = await setStatus(created.id, 'CONFIRMED');
    expect(res.status).toBe(200);
    expect(res.body.data.request.status).toBe('CONFIRMED');
  });

  it('rejects an invalid transition with 409', async () => {
    const created = await createRequestFor(buyer.id, { status: 'REJECTED' });

    const res = await setStatus(created.id, 'CONFIRMED');
    expect(res.status).toBe(409);
    const saved = await prisma.orderRequest.findUnique({ where: { id: created.id } });
    expect(saved.status).toBe('REJECTED');
  });

  it('rejects an unknown status value', async () => {
    const created = await createRequestFor(buyer.id);
    const res = await setStatus(created.id, 'DONE');
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown request', async () => {
    const res = await setStatus('00000000-0000-4000-8000-000000000000', 'CONTACTED');
    expect(res.status).toBe(404);
  });
});
