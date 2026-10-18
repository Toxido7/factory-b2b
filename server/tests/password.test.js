import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password.js';

describe('password helpers', () => {
  it('does not return the plain password', async () => {
    const hash = await hashPassword('MyPassw0rd!');

    expect(hash).not.toBe('MyPassw0rd!');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('accepts the correct password', async () => {
    const hash = await hashPassword('MyPassw0rd!');

    expect(await verifyPassword('MyPassw0rd!', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('MyPassw0rd!');

    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('gives different hashes for the same password (salt)', async () => {
    const hash1 = await hashPassword('MyPassw0rd!');
    const hash2 = await hashPassword('MyPassw0rd!');

    expect(hash1).not.toBe(hash2);
  });
});
