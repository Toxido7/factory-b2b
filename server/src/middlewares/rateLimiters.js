import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const MINUTE = 60 * 1000;

export const createLimiter = ({ windowMs, limit, message, ...extra }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ success: false, error: { message } });
    },
    ...extra,
  });

// In tests we turn the real limiters off so other tests aren't blocked
const skipInTests = () => env.NODE_ENV === 'test';

export const loginLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  skip: skipInTests,
  message: 'Too many login attempts, please try again later',
});

export const registerLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 10,
  skip: skipInTests,
  message: 'Too many accounts created from this network, please try again later',
});

export const refreshLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 60,
  skip: skipInTests,
  message: 'Too many requests, please try again later',
});
export const resendVerificationLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  skip: skipInTests,
  message: 'Too many emails requested, please try again later',
});
export const forgotPasswordLimiter = createLimiter({
  windowMs: 60 * MINUTE,
  limit: 5,
  skip: skipInTests,
  message: 'Too many reset requests, please try again later',
});

export const resetPasswordLimiter = createLimiter({
  windowMs: 15 * MINUTE,
  limit: 10,
  skip: skipInTests,
  message: 'Too many attempts, please try again later',
});
export const createRequestLimiter = createLimiter({
  windowMs: 60 * MINUTE, // 1 hour
  limit: 20,
  skip: skipInTests,
  message: 'Too many requests. Please try again later.',
});
export const changePasswordLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: 'Too many attempts, please try again later',
});
// Counts failed logins per ACCOUNT. The IP limiter cannot stop many IPs hitting one account.
export const emailKey = (req) => {
  const email = req.body?.email;
  return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : 'no-email';
};

export const loginAccountLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: 'Too many failed attempts for this account, please try again later',
  skipSuccessfulRequests: true,
  keyGenerator: emailKey,
});
