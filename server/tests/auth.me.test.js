import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { resetDb } from './helpers/db.js';

const creds = { email: 'me@test.com', password: 'Password123' };

const loginToken = async () => {
  const res = await request(app).post('/api/auth/login').send(creds);
  return res.body.data.accessToken;
};

describe('GET /api/auth/me', () => {
  beforeEach(async () => {
    await resetDb();
    await request(app)
      .post('/api/auth/register')
      .send({ ...creds, phone: '20123456', fullName: 'Me Tester' });
  });

  it('returns the current user with a valid token', async () => {
    const token = await loginToken();

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(creds.email);
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a garbage token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer abc.def.ghi');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a token signed by the wrong secret', async () => {
    const forged = jwt.sign({ role: 'ADMIN' }, 'x'.repeat(40), { subject: 'some-id' });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });

  it('returns 401 with an expired token', async () => {
    const expired = jwt.sign({ role: 'USER' }, env.JWT_ACCESS_SECRET, {
      subject: 'some-id',
      expiresIn: -10,
    });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);

    expect(res.status).toBe(401);
  });
});
