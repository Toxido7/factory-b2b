import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';
import { adminToken } from './helpers/auth.js';

const creds = { email: 'me@test.com', password: 'Password123' };
const valid = { fullName: 'New Name', companyName: 'Acme SARL', phone: '+216 20 123 456' };

const loginToken = async () => {
  const res = await request(app).post('/api/auth/login').send(creds);
  return res.body.data.accessToken;
};
const patchMe = (token, body) =>
  request(app).patch('/api/auth/me').set('Authorization', `Bearer ${token}`).send(body);
const getMe = (token) => request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

describe('PATCH /api/auth/me', () => {
  beforeEach(async () => {
    await resetDb();
    await request(app)
      .post('/api/auth/register')
      .send({ ...creds, phone: '20123456', fullName: 'Me Tester' });
  });

  it('updates name, company and phone', async () => {
    const token = await loginToken();
    const res = await patchMe(token, valid);
    expect(res.status).toBe(200);
    expect(res.body.data.user.fullName).toBe('New Name');
    expect(res.body.data.user.companyName).toBe('Acme SARL');
    expect(res.body.data.user.phone).toBe('+216 20 123 456');
  });

  it('shows the new values on GET /me', async () => {
    const token = await loginToken();
    await patchMe(token, valid);
    const res = await getMe(token);
    expect(res.body.data.user.fullName).toBe('New Name');
    expect(res.body.data.user.phone).toBe('+216 20 123 456');
  });

  it('never returns passwordHash', async () => {
    const token = await loginToken();
    const res = await patchMe(token, valid);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('keeps the company when companyName is omitted', async () => {
    const token = await loginToken();
    await patchMe(token, valid);
    const res = await patchMe(token, { fullName: 'New Name', phone: '20123456' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.companyName).toBe('Acme SARL');
  });

  it('clears the company with an empty string', async () => {
    const token = await loginToken();
    await patchMe(token, valid);
    const res = await patchMe(token, { ...valid, companyName: '' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.companyName).toBeNull();
  });

  it('trims spaces around the name', async () => {
    const token = await loginToken();
    const res = await patchMe(token, { ...valid, fullName: '  Spaced Name  ' });
    expect(res.body.data.user.fullName).toBe('Spaced Name');
  });

  it('ignores role, email and emailVerified in the body', async () => {
    const token = await loginToken();
    await patchMe(token, {
      ...valid,
      role: 'ADMIN',
      email: 'hacker@test.com',
      emailVerified: true,
    });
    const res = await getMe(token);
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.user.email).toBe(creds.email);
    expect(res.body.data.user.emailVerified).toBe(false);
  });

  it('does not change another user', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'other@test.com',
      password: 'Password123',
      phone: '20999999',
      fullName: 'Other Person',
    });
    const token = await loginToken();
    await patchMe(token, valid);
    const other = await prisma.user.findUnique({ where: { email: 'other@test.com' } });
    expect(other.fullName).toBe('Other Person');
    expect(other.phone).toBe('20999999');
  });

  it('works for an admin on their own profile', async () => {
    const token = await adminToken();
    const res = await patchMe(token, { fullName: 'Boss Admin', phone: '20555555' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.user.fullName).toBe('Boss Admin');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).patch('/api/auth/me').send(valid);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a disabled account', async () => {
    const token = await loginToken();
    await prisma.user.update({ where: { email: creds.email }, data: { isActive: false } });
    const res = await patchMe(token, valid);
    expect(res.status).toBe(401);
  });

  it.each([
    ['an empty body', {}],
    ['a missing phone', { fullName: 'New Name' }],
    ['an empty phone', { fullName: 'New Name', phone: '' }],
    ['an invalid phone', { fullName: 'New Name', phone: 'abc' }],
    ['a too short name', { fullName: 'A', phone: '20123456' }],
    ['a too long name', { fullName: 'x'.repeat(101), phone: '20123456' }],
    [
      'a too long company',
      { fullName: 'New Name', phone: '20123456', companyName: 'x'.repeat(151) },
    ],
  ])('returns 400 for %s', async (_label, body) => {
    const token = await loginToken();
    const res = await patchMe(token, body);
    expect(res.status).toBe(400);
  });
});
