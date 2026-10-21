import { describe, it, expect } from 'vitest';
import { detectImageType } from '../src/utils/imageType.js';

const pad = (bytes) => Buffer.concat([Buffer.from(bytes), Buffer.alloc(20)]);

describe('detectImageType', () => {
  it('detects jpg', () => {
    expect(detectImageType(pad([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpg');
  });

  it('detects png', () => {
    expect(detectImageType(pad([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
  });

  it('detects webp', () => {
    const webp = Buffer.concat([
      Buffer.from('RIFF'),
      Buffer.alloc(4),
      Buffer.from('WEBP'),
      Buffer.alloc(8),
    ]);
    expect(detectImageType(webp)).toBe('webp');
  });

  it('returns null for text', () => {
    expect(detectImageType(Buffer.from('this is plain text, not an image'))).toBeNull();
  });
});
