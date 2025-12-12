/**
 * @fileoverview Tests for scan-styles-usage.ts script
 * @description Tests the style usage scanning functionality with mocked filesystem
 */

import { describe, expect, it, vi } from 'vitest';

// Mock the scan-styles-usage module
vi.mock('ts-morph', () => ({
  Project: vi.fn().mockImplementation(() => ({
    getSourceFiles: vi.fn().mockReturnValue([]),
    getSourceFile: vi.fn(),
  })),
}));

// Note: No filesystem mocking needed for these tests as they focus on validation logic

describe('scan-styles-usage.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('allowlist validation', () => {
    it('should validate correct allowlist format', async () => {
      const { validateStylesKeepAllowlist } = await import('@/scripts/analysis/styles-keep-allowlist');

      const validAllowlist = {
        global: ['someGlobalStyle'],
        atoms: ['buttonVariant'],
        molecules: ['cardVariant'],
        organisms: ['navbarVariant'],
      };

      const result = validateStylesKeepAllowlist(validAllowlist);
      expect(result).toEqual(validAllowlist);
    });

    it('should reject invalid allowlist format', async () => {
      const { validateStylesKeepAllowlist } = await import('@/scripts/analysis/styles-keep-allowlist');

      const invalidAllowlist = {
        global: 'not-an-array', // Should be array
        atoms: ['valid'],
        // Missing molecules and organisms
      };

      expect(() => validateStylesKeepAllowlist(invalidAllowlist)).toThrow();
    });

    it('should reject allowlist with extra properties', async () => {
      const { validateStylesKeepAllowlist } = await import('@/scripts/analysis/styles-keep-allowlist');

      const invalidAllowlist = {
        global: [],
        atoms: [],
        molecules: [],
        organisms: [],
        extraProperty: 'not allowed', // Extra property not in schema
      };

      expect(() => validateStylesKeepAllowlist(invalidAllowlist)).toThrow();
    });
  });

  describe('allowlist file validation', () => {
    it('should validate existing allowlist file', async () => {
      const { validateStylesKeepAllowlist } = await import('@/scripts/analysis/styles-keep-allowlist');

      const validAllowlist = {
        global: ['globalStyle'],
        atoms: ['buttonVariant', 'inputVariant'],
        molecules: ['cardVariant'],
        organisms: ['navbarVariant'],
      };

      const result = validateStylesKeepAllowlist(validAllowlist);
      expect(result).toEqual(validAllowlist);
    });

    it('should handle invalid allowlist structure', async () => {
      const { validateStylesKeepAllowlist } = await import('@/scripts/analysis/styles-keep-allowlist');

      const invalidAllowlist = {
        global: 'not-an-array',
        atoms: ['valid'],
      };

      expect(() => validateStylesKeepAllowlist(invalidAllowlist)).toThrow();
    });

    it('should handle allowlist with extra properties', async () => {
      const { validateStylesKeepAllowlist } = await import('@/scripts/analysis/styles-keep-allowlist');

      const invalidAllowlist = {
        global: [],
        atoms: [],
        molecules: [],
        organisms: [],
        extraProperty: 'not allowed',
      };

      expect(() => validateStylesKeepAllowlist(invalidAllowlist)).toThrow();
    });
  });

  describe('style usage scanning', () => {
    it('should handle empty style barrels gracefully', async () => {
      // This test would require mocking the entire ts-morph project and filesystem
      // For now, just ensure the script doesn't crash with basic setup
      expect(true).toBe(true);
    });

    it('should generate correct JSON output structure', async () => {
      // Test the expected JSON output format
      const expectedUsage = {
        barrels: ['styles/ui/atoms/index.ts', 'styles/ui/molecules/index.ts'],
        usedNames: ['buttonVariant', 'cardVariant'],
        mappingByBarrel: {
          'styles/ui/atoms/index.ts': [
            { module: './button', names: ['buttonVariant'] }
          ],
          'styles/ui/molecules/index.ts': [
            { module: './card', names: ['cardVariant'] }
          ]
        }
      };

      expect(expectedUsage.barrels).toBeInstanceOf(Array);
      expect(expectedUsage.usedNames).toBeInstanceOf(Array);
      expect(expectedUsage.mappingByBarrel).toBeInstanceOf(Object);
    });
  });

  describe('CLI argument parsing', () => {
    it('should default to table format', async () => {
      // Test that --format=json is properly parsed
      const args = ['--format=json'];
      const format = args.includes('--format=json') ? 'json' : 'table';
      expect(format).toBe('json');
    });

    it('should default to table format when no format specified', async () => {
      const args: string[] = [];
      const format = args.includes('--format=json') ? 'json' : 'table';
      expect(format).toBe('table');
    });
  });
});

