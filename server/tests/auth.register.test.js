import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

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
