import { describe, it, expect } from 'vitest';
import { resolveRange } from '../src/utils/dateRange.js';

const NOW = new Date('2026-10-22T15:00:00Z');

describe('resolveRange', () => {
  it('defaults to the last 30 days ending today', () => {
    const r = resolveRange({}, NOW);

    expect(r).toMatchObject({ from: '2026-09-23', to: '2026-10-22', days: 30 });
    expect(r.end.toISOString()).toBe('2026-10-23T00:00:00.000Z');
  });

  it('uses the given days and makes the end exclusive', () => {
    const r = resolveRange({ from: '2026-10-01', to: '2026-10-10' }, NOW);

    expect(r.start.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(r.end.toISOString()).toBe('2026-10-11T00:00:00.000Z');
    expect(r.days).toBe(10);
  });

  it('accepts a single day', () => {
    const r = resolveRange({ from: '2026-10-05', to: '2026-10-05' }, NOW);
    expect(r.days).toBe(1);
  });

  it('throws when from is after to', () => {
    expect(() => resolveRange({ from: '2026-10-10', to: '2026-10-01' }, NOW)).toThrow(
      'must be before',
    );
  });

  it('throws when the range is longer than 366 days', () => {
    expect(() => resolveRange({ from: '2025-01-01', to: '2026-10-01' }, NOW)).toThrow('limited');
  });
});
