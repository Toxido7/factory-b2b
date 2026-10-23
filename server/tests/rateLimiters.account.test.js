import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createLimiter, emailKey } from '../src/middlewares/rateLimiters.js';

describe('emailKey', () => {
  it('trims and lowercases the email', () => {
    expect(emailKey({ body: { email: '  Ali@Example.COM ' } })).toBe('ali@example.com');
  });

  it('falls back when there is no body or no email', () => {
    expect(emailKey({})).toBe('no-email');
    expect(emailKey({ body: {} })).toBe('no-email');
  });

  it('falls back when the email is not a string', () => {
    expect(emailKey({ body: { email: { $ne: 1 } } })).toBe('no-email');
  });
});

describe('per-account login limiter', () => {
  it('blocks one account after too many failures, and only that account', async () => {
    const app = express();
    app.use(express.json());
    const limiter = createLimiter({
      windowMs: 60_000,
      limit: 2,
      message: 'Too many',
      skipSuccessfulRequests: true,
      keyGenerator: emailKey,
      skip: () => false, // the real limiters are skipped when NODE_ENV=test
    });
    app.post('/login', limiter, (req, res) => res.status(401).json({}));
    const attempt = (email) => request(app).post('/login').send({ email });

    expect((await attempt('a@example.com')).status).toBe(401);
    expect((await attempt('a@example.com')).status).toBe(401);
    expect((await attempt('a@example.com')).status).toBe(429);
    expect((await attempt('  A@EXAMPLE.COM ')).status).toBe(429); // same account, other spelling
    expect((await attempt('b@example.com')).status).toBe(401); // another account is not affected
  });
});
