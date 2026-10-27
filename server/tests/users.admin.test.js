import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';
import { adminToken, userToken } from './helpers/auth.js';

const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000';
const auth = (token) => ({ Authorization: `Bearer ${token}` });

const makeUser = (data = {}) =>
  prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash: 'not-a-real-hash',
      fullName: 'Test Customer',
      ...data,
    },
  });

beforeEach(async () => {
  await resetDb();
});

describe('GET /api/admin/users', () => {
  it('lists users with pagination and never exposes passwordHash', async () => {
    const token = await adminToken();
    await makeUser({ email: 'a@example.com', createdAt: new Date('2026-01-01') });
    await makeUser({ email: 'b@example.com', createdAt: new Date('2026-01-02') });

    const res = await request(app).get('/api/admin/users?limit=2').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.users).toHaveLength(2);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 });
    expect(res.body.data.users[0]).toHaveProperty('requestCount', 0);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('searches by name, company and email (case-insensitive)', async () => {
    const token = await adminToken();
    await makeUser({ email: 'ali@steel.tn', fullName: 'Ali Ben Salah', companyName: 'Steel Co' });
    await makeUser({
      email: 'sara@plastic.tn',
      fullName: 'Sara Trabelsi',
      companyName: 'Plastic Co',
    });

    const byName = await request(app).get('/api/admin/users?q=trabelsi').set(auth(token));
    const byCompany = await request(app).get('/api/admin/users?q=STEEL').set(auth(token));
    const byEmail = await request(app).get('/api/admin/users?q=plastic.tn').set(auth(token));

    expect(byName.body.data.users.map((u) => u.email)).toEqual(['sara@plastic.tn']);
    expect(byCompany.body.data.users.map((u) => u.email)).toEqual(['ali@steel.tn']);
    expect(byEmail.body.data.users.map((u) => u.email)).toEqual(['sara@plastic.tn']);
  });

  it('filters by isActive', async () => {
    const token = await adminToken();
    await makeUser({ email: 'off@example.com', isActive: false });

    const res = await request(app).get('/api/admin/users?isActive=false').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.users.map((u) => u.email)).toEqual(['off@example.com']);
  });

  it('filters by role', async () => {
    const token = await adminToken();
    await makeUser();

    const res = await request(app).get('/api/admin/users?role=ADMIN').set(auth(token));

    expect(res.body.data.users).toHaveLength(1);
    expect(res.body.data.users[0].role).toBe('ADMIN');
  });

  it('returns 400 when limit is too big', async () => {
    const token = await adminToken();
    const res = await request(app).get('/api/admin/users?limit=1000').set(auth(token));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/admin/users/:id', () => {
  it('returns one user with the number of requests', async () => {
    const token = await adminToken();
    const customer = await makeUser();
    await prisma.orderRequest.create({
      data: {
        userId: customer.id,
        customerName: customer.fullName,
        customerEmail: customer.email,
        estimatedTotal: 0,
      },
    });

    const res = await request(app).get(`/api/admin/users/${customer.id}`).set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('customer@example.com');
    expect(res.body.data.user.requestCount).toBe(1);
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('returns 404 for an unknown id', async () => {
    const token = await adminToken();
    const res = await request(app).get(`/api/admin/users/${UNKNOWN_ID}`).set(auth(token));
    expect(res.status).toBe(404);
  });

  it('returns 400 when the id is not a UUID', async () => {
    const token = await adminToken();
    const res = await request(app).get('/api/admin/users/abc').set(auth(token));
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/admin/users/:id/status', () => {
  it('disables a user, revokes their refresh tokens and blocks login', async () => {
    const token = await adminToken();
    const creds = { email: 'victim@example.com', password: 'Password123' };
    await request(app)
      .post('/api/auth/register')
      .send({ ...creds, phone: '20123456', fullName: 'Victim User' });
    const victim = await prisma.user.findUnique({ where: { email: creds.email } });
    const login = await request(app).post('/api/auth/login').send(creds);
    expect(login.status).toBe(200);
    const active = () =>
      prisma.refreshToken.count({ where: { userId: victim.id, revokedAt: null } });
    expect(await active()).toBe(1);

    const res = await request(app)
      .patch(`/api/admin/users/${victim.id}/status`)
      .set(auth(token))
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.user.isActive).toBe(false);
    expect(await active()).toBe(0);
    const again = await request(app).post('/api/auth/login').send(creds);
    expect(again.status).toBe(403);
  });

  it('enables a disabled user again', async () => {
    const token = await adminToken();
    const customer = await makeUser({ isActive: false });

    const res = await request(app)
      .patch(`/api/admin/users/${customer.id}/status`)
      .set(auth(token))
      .send({ isActive: true });

    expect(res.status).toBe(200);
    expect(res.body.data.user.isActive).toBe(true);
  });

  it('does not let an admin disable their own account', async () => {
    const token = await adminToken();
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    const res = await request(app)
      .patch(`/api/admin/users/${admin.id}/status`)
      .set(auth(token))
      .send({ isActive: false });

    expect(res.status).toBe(400);
    const fresh = await prisma.user.findUnique({ where: { id: admin.id } });
    expect(fresh.isActive).toBe(true);
  });

  it('is idempotent: disabling twice returns 200 both times', async () => {
    const token = await adminToken();
    const customer = await makeUser();
    const disable = () =>
      request(app)
        .patch(`/api/admin/users/${customer.id}/status`)
        .set(auth(token))
        .send({ isActive: false });

    expect((await disable()).status).toBe(200);
    expect((await disable()).status).toBe(200);
  });

  it('returns 404 for an unknown id', async () => {
    const token = await adminToken();
    const res = await request(app)
      .patch(`/api/admin/users/${UNKNOWN_ID}/status`)
      .set(auth(token))
      .send({ isActive: false });
    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid body', async () => {
    const token = await adminToken();
    const customer = await makeUser();
    const patch = (body) =>
      request(app).patch(`/api/admin/users/${customer.id}/status`).set(auth(token)).send(body);

    expect((await patch({ isActive: 'false' })).status).toBe(400);
    expect((await patch({})).status).toBe(400);
  });
});

describe('guards', () => {
  const routes = [
    ['GET', '/api/admin/users'],
    ['GET', `/api/admin/users/${UNKNOWN_ID}`],
    ['PATCH', `/api/admin/users/${UNKNOWN_ID}/status`],
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
