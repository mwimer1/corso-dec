/**
 * @fileoverview Tests for frontmatter utilities
 * @description Date normalization and frontmatter handling
 */

import { describe, expect, it } from 'vitest';
import { getCurrentDate, normalizeDate } from '../lib/frontmatter';

describe('Frontmatter utilities', () => {
  describe('getCurrentDate', () => {
    it('should return current date in YYYY-MM-DD format', () => {
      const result = getCurrentDate();
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Should be a valid date
      const date = new Date(result);
      expect(isNaN(date.getTime())).toBe(false);
    });

    it('should return today or earlier date', () => {
      const result = getCurrentDate();
      const today = new Date().toISOString().slice(0, 10);

      // Should be today or earlier (in case of timezone differences)
      expect(result <= today).toBe(true);
    });
  });

  describe('normalizeDate', () => {
    it('should normalize valid ISO date strings', () => {
      const result = normalizeDate('2023-12-25T10:30:00Z');
      expect(result).toBe('2023-12-25');
      expect(typeof result).toBe('string');
    });

    it('should handle date-only strings', () => {
      const result = normalizeDate('2023-12-25');
      expect(result).toBe('2023-12-25');
    });

    it('should fallback to current date for invalid dates', () => {
      const result = normalizeDate('invalid-date');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle empty or undefined input', () => {
      // This tests the internal normalizeDate function behavior
      // In practice, this function should not be called with undefined
      // but we want to ensure it handles edge cases gracefully
      const result = normalizeDate('');
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

