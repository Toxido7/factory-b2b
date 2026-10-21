import { describe, it, expect } from 'vitest';
import { Prisma } from '@prisma/client';
import { finalUnitPrice, lineTotal, sum } from '../src/utils/pricing.js';

describe('pricing', () => {
  it('rounds the discounted unit price to 2 decimals', () => {
    // 19.99 * 0.875 = 17.49125
    expect(finalUnitPrice('19.99', '12.50').toFixed(2)).toBe('17.49');
  });

  it('multiplies the ROUNDED unit price by the quantity', () => {
    expect(lineTotal('19.99', '12.50', 6).toFixed(2)).toBe('104.94');
  });

  it('adds money exactly', () => {
    const total = sum([new Prisma.Decimal('0.1'), new Prisma.Decimal('0.2')]);
    expect(total.toFixed(2)).toBe('0.30');
  });
});
