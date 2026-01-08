/**
 * @fileoverview Tests for CLI parsing and option handling
 * @description CLI argument parsing with exactOptionalPropertyTypes compliance
 */

import { describe, expect, it } from 'vitest';
import { isDefined } from '../../_utils/guards';

// Test the guard-then-assign pattern used in CLI parsing
describe('CLI parsing utilities', () => {
  describe('guard-then-assign pattern', () => {
    it('should handle defined array values', () => {
      const args = ['--domains', 'lib,components,types'];
      const options: { domains?: string[] } = {};

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--domains' && args[i + 1]) {
          const domainsValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
          if (isDefined(domainsValue)) {
            options.domains = domainsValue;
          }
        }
      }

      expect(options.domains).toEqual(['lib', 'components', 'types']);
    });

    it('should handle undefined array values', () => {
      const args = ['--domains'];
      const options: { domains?: string[] } = {};

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--domains' && args[i + 1]) {
          const domainsValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
          if (isDefined(domainsValue)) {
            options.domains = domainsValue;
          }
        }
      }

      expect(options.domains).toBeUndefined();
    });

    it('should handle empty array values', () => {
      const args = ['--domains', ''];
      const options: { domains?: string[] } = {};

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--domains' && args[i + 1]) {
          const domainsValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
          if (isDefined(domainsValue)) {
            options.domains = domainsValue;
          }
        }
      }

      expect(options.domains).toBeUndefined();
    });

    it('should handle mixed valid and empty values', () => {
      const args = ['--domains', 'lib,,components,'];
      const options: { domains?: string[] } = {};

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--domains' && args[i + 1]) {
          const domainsValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
          if (isDefined(domainsValue)) {
            options.domains = domainsValue;
          }
        }
      }

      expect(options.domains).toEqual(['lib', 'components']);
    });
  });

  describe('multiple optional fields', () => {
    it('should handle multiple optional fields independently', () => {
      const args = ['--include', 'lib/**', '--exclude', 'lib/exclude/**', '--domains', 'components'];
      const options: { include?: string[]; exclude?: string[]; domains?: string[] } = {};

      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--include' && args[i + 1]) {
          const includeValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
          if (isDefined(includeValue)) {
            options.include = includeValue;
          }
        } else if (arg === '--exclude' && args[i + 1]) {
          const excludeValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
          if (isDefined(excludeValue)) {
            options.exclude = excludeValue;
          }
        } else if (arg === '--domains' && args[i + 1]) {
          const domainsValue = args[++i]?.split(',').map(s => s.trim()).filter(Boolean);
          if (isDefined(domainsValue)) {
            options.domains = domainsValue;
          }
        }
      }

      expect(options.include).toEqual(['lib/**']);
      expect(options.exclude).toEqual(['lib/exclude/**']);
      expect(options.domains).toEqual(['components']);
    });
  });
});

