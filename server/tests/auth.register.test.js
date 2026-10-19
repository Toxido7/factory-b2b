import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { resetDb } from './helpers/db.js';

const validBody = {
  email: 'ahmed@test.com',
  password: 'Passw0rd123',
  fullName: 'Ahmed Test',
};

const register = (body) => request(app).post('/api/auth/register').send(body);

describe('POST /api/auth/register: validation', () => {
  it('rejects an invalid email', async () => {
    const res = await register({ ...validBody, email: 'nope' });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toContain('body.email');
  });

  it('rejects a password that is too short', async () => {
    const res = await register({ ...validBody, password: 'Ab1' });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toContain('body.password');
  });

  it('rejects a password longer than 72 characters', async () => {
    const res = await register({ ...validBody, password: 'a1'.repeat(40) });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toContain('body.password');
  });

  it('rejects a missing full name', async () => {
    const res = await register({ email: validBody.email, password: validBody.password });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toContain('body.fullName');
  });

  it('rejects an empty body', async () => {
    const res = await register({});

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/register: database', () => {
  beforeEach(resetDb);

  it('creates a user and never returns the password hash', async () => {
    const res = await register({ ...validBody, email: 'Ahmed@Test.com', role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ahmed@test.com');
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(validBody.password);
  });

  it('stores a hash, not the plain password', async () => {
    await register(validBody);

    const saved = await prisma.user.findUnique({ where: { email: validBody.email } });

    expect(saved.passwordHash).not.toBe(validBody.password);
    expect(saved.passwordHash.startsWith('$2')).toBe(true);
  });

  it('rejects a duplicate email', async () => {
    await register(validBody);
    const res = await register(validBody);

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Email already registered');
  });

  it('treats emails with different capitals as the same account', async () => {
    await register(validBody);
    const res = await register({ ...validBody, email: 'AHMED@TEST.COM' });

    expect(res.status).toBe(409);
  });
});
