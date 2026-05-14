import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatDate } from '../DocPage';

/**
 * Feature: lumibase-docs-viewer, Property 8: Date formatting
 *
 * For any valid ISO date string provided as a last-modified timestamp,
 * the displayed date SHALL be formatted as DD/MM/YYYY.
 *
 * **Validates: Requirements 9.5**
 */
describe('Feature: lumibase-docs-viewer, Property 8: Date formatting', () => {
  it('should format any valid date as DD/MM/YYYY with correct values', () => {
    fc.assert(
      fc.property(
        // Generate random year, month, day components for valid dates
        fc.integer({ min: 1970, max: 2100 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid day-of-month issues
        (year, month, day) => {
          // Build an ISO date string from the components
          const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`;

          const result = formatDate(isoDate);

          // Result must be defined for valid dates
          expect(result).toBeDefined();

          // Result must match DD/MM/YYYY format
          expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);

          // Parse the result and verify correctness
          const [dd, mm, yyyy] = result!.split('/');

          // Day should be zero-padded and match the input day
          expect(dd).toBe(String(day).padStart(2, '0'));

          // Month should be zero-padded and match the input month
          expect(mm).toBe(String(month).padStart(2, '0'));

          // Year should match the input year
          expect(yyyy).toBe(String(year));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return undefined for undefined input', () => {
    expect(formatDate(undefined)).toBeUndefined();
  });

  it('should return undefined for invalid date strings', () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => isNaN(new Date(s).getTime())),
        (invalidDate) => {
          expect(formatDate(invalidDate)).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });
});
