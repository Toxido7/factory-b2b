import { describe, it, expect } from 'vitest';
import { formatReference, parseReference } from '../src/utils/reference.js';

describe('formatReference', () => {
  it('pads the number to 5 digits', () => {
    expect(formatReference(42, new Date('2026-03-10T10:00:00Z'))).toBe('REQ-2026-00042');
  });

  it('uses the year of the request', () => {
    expect(formatReference(7, new Date('2027-01-05T10:00:00Z'))).toBe('REQ-2027-00007');
  });
});

describe('parseReference', () => {
  it('reads the number from a reference', () => {
    expect(parseReference('REQ-2026-00042')).toBe(42);
    expect(parseReference(' req-2026-00007 ')).toBe(7);
  });

  it('returns null when the text is not a reference', () => {
    expect(parseReference('Acme Corp')).toBeNull();
    expect(parseReference('REQ-2026-')).toBeNull();
  });
});
