import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { userToken } from './helpers/auth.js';

const ID = '00000000-0000-4000-8000-000000000000';

// Admin-only routes added in Sprint 4: 401 without a token, 403 for a normal user
const adminRoutes = [
  ['GET', '/api/admin/users'],
  ['GET', `/api/admin/users/${ID}`],
  ['PATCH', `/api/admin/users/${ID}/status`],
  ['PATCH', `/api/admin/users/${ID}/role`],
  ['GET', '/api/admin/stats/overview'],
  ['GET', '/api/admin/stats/requests-over-time'],
  ['GET', '/api/admin/stats/top-products'],
  ['GET', '/api/admin/stats/top-customers'],
];

// Routes for any logged-in user: 401 without a token
const loggedInRoutes = [
  ['POST', '/api/auth/change-password'],
  ['POST', '/api/auth/logout-all'],
];

describe('Sprint 4 contract', () => {
  it.each(adminRoutes)('%s %s returns 401 without a token', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path);
    expect(res.status).toBe(401);
  });

  it.each(adminRoutes)('%s %s returns 403 for a normal user', async (method, path) => {
    const token = await userToken();
    const res = await request(app)
      [method.toLowerCase()](path)
      .set({ Authorization: `Bearer ${token}` });
    expect(res.status).toBe(403);
  });

  it.each(loggedInRoutes)('%s %s returns 401 without a token', async (method, path) => {
    const res = await request(app)[method.toLowerCase()](path);
    expect(res.status).toBe(401);
  });
});
