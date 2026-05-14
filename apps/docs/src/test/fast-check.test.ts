import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('fast-check setup verification', () => {
  it('should run a trivial property-based test', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        expect(a + b).toBe(b + a);
      }),
    );
  });

  it('should run a string property-based test', () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        expect(s.length).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});
