import { describe, it, expect } from 'vitest';
import { canTransition } from '../src/modules/requests/requests.status.js';

describe('canTransition', () => {
  it('allows PENDING to CONTACTED', () => {
    expect(canTransition('PENDING', 'CONTACTED')).toBe(true);
  });

  it('allows CONFIRMED to CANCELLED', () => {
    expect(canTransition('CONFIRMED', 'CANCELLED')).toBe(true);
  });

  it('blocks changes from a final status', () => {
    expect(canTransition('REJECTED', 'CONFIRMED')).toBe(false);
    expect(canTransition('CANCELLED', 'PENDING')).toBe(false);
  });

  it('blocks the same status and going backwards', () => {
    expect(canTransition('PENDING', 'PENDING')).toBe(false);
    expect(canTransition('CONTACTED', 'PENDING')).toBe(false);
  });
});
