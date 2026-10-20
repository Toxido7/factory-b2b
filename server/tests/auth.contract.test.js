import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// [method, path, status expected when you send NO credentials and an empty body]
const contract = [
  ['get', '/api/auth/me', 401],
  ['post', '/api/auth/resend-verification', 401],
  ['post', '/api/auth/register', 400],
  ['post', '/api/auth/login', 400],
  ['post', '/api/auth/verify-email', 400],
  ['post', '/api/auth/forgot-password', 400],
  ['post', '/api/auth/reset-password', 400],
  ['get', '/api/auth/logout', 404], // logout is POST only
  ['get', '/api/auth/refresh', 404], // refresh is POST only
];

describe('auth API contract (no credentials, empty body)', () => {
  it.each(contract)('%s %s answers %i', async (method, path, status) => {
    const call = request(app)[method](path);
    const res = method === 'post' ? await call.send({}) : await call;

    expect(res.status).toBe(status);
  });
});
