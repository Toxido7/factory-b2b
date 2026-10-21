import { describe, it, expect } from 'vitest';
import { formatReference } from '../src/utils/reference.js';

describe('formatReference', () => {
  it('pads the number to 5 digits', () => {
    expect(formatReference(42, new Date('2026-03-10T10:00:00Z'))).toBe('REQ-2026-00042');
  });

  it('uses the year of the request', () => {
    expect(formatReference(7, new Date('2027-01-05T10:00:00Z'))).toBe('REQ-2027-00007');
  });
});
