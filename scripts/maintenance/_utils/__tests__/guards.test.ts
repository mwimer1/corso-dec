/**
 * @fileoverview Tests for guard utilities
 * @description Type guards for exactOptionalPropertyTypes compliance
 */

import { describe, expect, it } from 'vitest';
import { isDefined, isFn, isNonEmptyString } from '../guards';

describe('Guard utilities', () => {
  describe('isDefined', () => {
    it('should return true for defined values', () => {
      expect(isDefined('string')).toBe(true);
      expect(isDefined(42)).toBe(true);
      expect(isDefined({})).toBe(true);
      expect(isDefined([])).toBe(true);
      expect(isDefined(false)).toBe(true);
    });

    it('should return false for undefined and null', () => {
      expect(isDefined(undefined)).toBe(false);
      expect(isDefined(null)).toBe(false);
    });

    it('should properly narrow types', () => {
      const value: string | undefined = 'test';
      if (isDefined(value)) {
        // TypeScript should know value is string here
        expect(typeof value).toBe('string');
      }
    });
  });

  describe('isFn', () => {
    it('should return true for functions', () => {
      expect(isFn(() => {})).toBe(true);
      expect(isFn(function() {})).toBe(true);
      expect(isFn(async () => {})).toBe(true);
      expect(isFn(class {})).toBe(true);
    });

    it('should return false for non-functions', () => {
      expect(isFn('string')).toBe(false);
      expect(isFn(42)).toBe(false);
      expect(isFn({})).toBe(false);
      expect(isFn(null)).toBe(false);
      expect(isFn(undefined)).toBe(false);
    });

    it('should properly narrow types', () => {
      const value: unknown = () => 'test';
      if (isFn(value)) {
        // TypeScript should know value is a function here
        expect(typeof value).toBe('function');
        expect(value()).toBe('test');
      }
    });
  });

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('test')).toBe(true);
      expect(isNonEmptyString(' ')).toBe(true);
      expect(isNonEmptyString('123')).toBe(true);
    });

    it('should return false for empty strings and non-strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString(42)).toBe(false);
      expect(isNonEmptyString({})).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
    });

    it('should properly narrow types', () => {
      const value: unknown = 'test string';
      if (isNonEmptyString(value)) {
        // TypeScript should know value is string here
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      }
    });
  });
});

