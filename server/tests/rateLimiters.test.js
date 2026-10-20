import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { createLimiter } from '../src/middlewares/rateLimiters.js';

const makeApp = (extra = {}) => {
  const app = express();
  const limiter = createLimiter({
    windowMs: 60 * 1000,
    limit: 3,
    message: 'Slow down',
    ...extra,
  });

  // /ping always succeeds, /fail always answers 401
  app.get('/ping', limiter, (req, res) => res.json({ success: true }));
  app.get('/fail', limiter, (req, res) => res.status(401).json({ success: false }));
  return app;
};

describe('createLimiter', () => {
  it('allows requests up to the limit', async () => {
    const app = makeApp();

    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/ping');
      expect(res.status).toBe(200);
    }
  });

  it('answers 429 with our error format after the limit', async () => {
    const app = makeApp();
    for (let i = 0; i < 3; i++) await request(app).get('/ping');

    const res = await request(app).get('/ping');

    expect(res.status).toBe(429);
    expect(res.body).toEqual({ success: false, error: { message: 'Slow down' } });
  });

  it('tells the client how long to wait (Retry-After header)', async () => {
    const app = makeApp();
    for (let i = 0; i < 3; i++) await request(app).get('/ping');

    const res = await request(app).get('/ping');

    expect(res.headers['retry-after']).toBeDefined();
  });

  it('counts only failed requests when skipSuccessfulRequests is on', async () => {
    const app = makeApp({ skipSuccessfulRequests: true });

    // 10 successful requests don't use up the budget
    for (let i = 0; i < 10; i++) {
      const ok = await request(app).get('/ping');
      expect(ok.status).toBe(200);
    }

    // but 3 failures do
    for (let i = 0; i < 3; i++) await request(app).get('/fail');
    const blocked = await request(app).get('/fail');

    expect(blocked.status).toBe(429);
  });

  it('keeps separate counters for separate limiters', async () => {
    const appA = makeApp();
    const appB = makeApp();
    for (let i = 0; i < 4; i++) await request(appA).get('/ping');

    const res = await request(appB).get('/ping');

    expect(res.status).toBe(200);
  });
});
