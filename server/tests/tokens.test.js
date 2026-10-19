import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from '../src/utils/tokens.js';

const user = { id: 'user-123', role: 'USER' };

describe('access tokens', () => {
  it('round-trips the user id and role', () => {
    const payload = verifyAccessToken(signAccessToken(user));

    expect(payload.sub).toBe('user-123');
    expect(payload.role).toBe('USER');
  });

  it('rejects a token signed with another secret', () => {
    const forged = jwt.sign({ role: 'ADMIN' }, 'some-other-secret', { subject: 'user-123' });

    expect(() => verifyAccessToken(forged)).toThrow();
  });

  it('rejects a tampered token', () => {
    const [header, , signature] = signAccessToken(user).split('.');
    const fakePayload = Buffer.from(JSON.stringify({ sub: 'user-123', role: 'ADMIN' })).toString(
      'base64url',
    );

    expect(() => verifyAccessToken(`${header}.${fakePayload}.${signature}`)).toThrow();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ role: 'USER' }, process.env.JWT_ACCESS_SECRET, {
      subject: 'user-123',
      expiresIn: '-10s',
    });

    expect(() => verifyAccessToken(expired)).toThrow();
  });
});
describe('refresh tokens', () => {
  it('generates a different random token every time', () => {
    expect(generateRefreshToken()).not.toBe(generateRefreshToken());
  });

  it('hashes deterministically, and the hash is not the token', () => {
    const token = generateRefreshToken();

    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });

  it('produces a 64-character hex hash', () => {
    expect(hashToken('anything')).toMatch(/^[0-9a-f]{64}$/);
  });
});
