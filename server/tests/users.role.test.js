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

const setRole = (token, id, body) =>
  request(app).patch(`/api/admin/users/${id}/role`).set(auth(token)).send(body);

beforeEach(async () => {
  await resetDb();
});

describe('PATCH /api/admin/users/:id/role', () => {
  it('promotes a user to ADMIN', async () => {
    const token = await adminToken();
    const customer = await makeUser();

    const res = await setRole(token, customer.id, { role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(JSON.stringify(res.body)).not.toContain('passwordHash');
  });

  it('demotes an admin to USER when another active admin exists', async () => {
    const token = await adminToken();
    const other = await makeUser({ email: 'admin2@example.com', role: 'ADMIN' });

    const res = await setRole(token, other.id, { role: 'USER' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('USER');
  });

  it('revokes the refresh tokens of the user whose role changed', async () => {
    const token = await adminToken();
    const creds = { email: 'victim@example.com', password: 'Password123' };
    await request(app)
      .post('/api/auth/register')
      .send({ ...creds, fullName: 'Victim User' });
    const victim = await prisma.user.findUnique({ where: { email: creds.email } });
    await request(app).post('/api/auth/login').send(creds);
    const active = () =>
      prisma.refreshToken.count({ where: { userId: victim.id, revokedAt: null } });
    expect(await active()).toBe(1);

    const res = await setRole(token, victim.id, { role: 'ADMIN' });

    expect(res.status).toBe(200);
    expect(await active()).toBe(0);
  });

  it('is idempotent: same role returns 200', async () => {
    const token = await adminToken();
    const customer = await makeUser();

    const res = await setRole(token, customer.id, { role: 'USER' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('USER');
  });

  it('does not let an admin change their own role', async () => {
    const token = await adminToken();
    const me = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    const res = await setRole(token, me.id, { role: 'USER' });

    expect(res.status).toBe(400);
    const fresh = await prisma.user.findUnique({ where: { id: me.id } });
    expect(fresh.role).toBe('ADMIN');
  });

  it('refuses to demote the last active admin', async () => {
    const token = await adminToken();
    const target = await makeUser({ email: 'admin2@example.com', role: 'ADMIN' });
    // The acting admin is disabled in the DB, but their token still works (known limit)
    await prisma.user.updateMany({
      where: { role: 'ADMIN', id: { not: target.id } },
      data: { isActive: false },
    });

    const res = await setRole(token, target.id, { role: 'USER' });

    expect(res.status).toBe(409);
    const fresh = await prisma.user.findUnique({ where: { id: target.id } });
    expect(fresh.role).toBe('ADMIN');
  });

  it('refuses to promote a disabled account', async () => {
    const token = await adminToken();
    const customer = await makeUser({ isActive: false });

    const res = await setRole(token, customer.id, { role: 'ADMIN' });

    expect(res.status).toBe(409);
  });

  it('returns 404 for an unknown id', async () => {
    const token = await adminToken();
    const res = await setRole(token, UNKNOWN_ID, { role: 'ADMIN' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid role or an empty body', async () => {
    const token = await adminToken();
    const customer = await makeUser();

    expect((await setRole(token, customer.id, { role: 'SUPERBOSS' })).status).toBe(400);
    expect((await setRole(token, customer.id, {})).status).toBe(400);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${UNKNOWN_ID}/role`)
      .send({ role: 'ADMIN' });
    expect(res.status).toBe(401);
  });

  it('returns 403 for a normal user', async () => {
    const token = await userToken();
    const res = await setRole(token, UNKNOWN_ID, { role: 'ADMIN' });
    expect(res.status).toBe(403);
  });
});
