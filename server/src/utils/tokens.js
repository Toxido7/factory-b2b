import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    algorithm: 'HS256',
  });

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });

export const generateRefreshToken = () => crypto.randomBytes(48).toString('base64url');

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
export const generateUrlToken = () => crypto.randomBytes(32).toString('base64url');
