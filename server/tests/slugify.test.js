import { describe, it, expect } from 'vitest';
import { slugify } from '../src/utils/slugify.js';

describe('slugify', () => {
  it('removes accents and lowercases', () => {
    expect(slugify('Équipement de sécurité')).toBe('equipement-de-securite');
  });

  it('turns symbols and extra spaces into single dashes', () => {
    expect(slugify('  Gloves & Boots!! ')).toBe('gloves-boots');
  });

  it('returns an empty string when there are no latin letters or numbers', () => {
    expect(slugify('قفازات')).toBe('');
  });
});
