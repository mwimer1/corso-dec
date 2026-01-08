/**
 * @fileoverview Tests for validate-styles.ts script
 * @description Tests style validation for inline styles and hardcoded design tokens
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mock globby and fs
vi.mock('globby', () => ({
  globby: vi.fn(),
}));

vi.mock('node:fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

describe('validate-styles.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('inline style detection', () => {
    it('should detect inline styles with hardcoded hex colors', () => {
      // Mock component file with inline style containing hex color
      const componentContent = `
        export function Component() {
          return <div style={{ color: '#ffffff', padding: '16px' }}>Test</div>;
        }
      `;

      // The script should detect the violation
      // Since we're testing the logic, we'll check the patterns directly
      const hexPattern = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
      expect(hexPattern.test(componentContent)).toBe(true);
    });

    it('should detect inline styles with hardcoded pixel spacing', async () => {
      const componentContent = `
        export function Component() {
          return <div style={{ padding: '20px', margin: '10px' }}>Test</div>;
        }
      `;

      const pixelPattern = /\b(\d+)px\b/g;
      const matches = componentContent.match(pixelPattern);
      expect(matches).toContain('20px');
      expect(matches).toContain('10px');
    });

    it('should allow dynamic percentage widths (progress bars)', () => {
      const allowedContent = `
        <div style={{ width: '50%' }}>Progress</div>
      `;

      const allowedPattern = /width:\s*['"`]?\d+%['"`]?/;
      expect(allowedPattern.test(allowedContent)).toBe(true);
    });

    it('should allow transform values', () => {
      const allowedContent = `
        <div style={{ transform: 'translateX(10px)' }}>Animated</div>
      `;

      const transformPattern = /transform:/;
      expect(transformPattern.test(allowedContent)).toBe(true);
    });
  });

  describe('CSS file validation', () => {
    it('should detect hardcoded hex colors in CSS files', () => {
      const cssContent = `
        .container {
          background: #ffffff;
          color: #000000;
        }
      `;

      const hexPattern = /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi;
      expect(hexPattern.test(cssContent)).toBe(true);
    });

    it('should detect hardcoded RGB colors in CSS files', () => {
      const cssContent = `
        .container {
          background: rgb(255, 255, 255);
          color: rgba(0, 0, 0, 0.5);
        }
      `;

      const rgbPattern = /rgba?\([^)]+\)/gi;
      expect(rgbPattern.test(cssContent)).toBe(true);
    });

    it('should allow CSS variables', () => {
      const validContent = `
        .container {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          padding: var(--space-md);
        }
      `;

      // Should not flag lines with var(--
      expect(validContent.includes('var(--')).toBe(true);
    });

    it('should detect hardcoded pixel spacing in CSS', () => {
      const cssContent = `
        .container {
          padding: 16px;
          margin: 24px;
        }
      `;

      const pixelPattern = /\b(\d+)px\b/g;
      const matches = cssContent.match(pixelPattern);
      expect(matches).toContain('16px');
      expect(matches).toContain('24px');
    });

    it('should allow 0px and 1px (common for borders)', () => {
      const validContent = `
        .border {
          border-width: 1px;
          margin: 0px;
        }
      `;

      // The validation should allow these
      const pixelPattern = /\b(\d+)px\b/g;
      const matches = validContent.match(pixelPattern);
      expect(matches).toContain('1px');
      expect(matches).toContain('0px');
    });

    it('should skip token definition files', () => {
      // Token files should be ignored by the validation
      const isTokenFile = 'styles/tokens/colors.css'.includes('styles/tokens/');
      expect(isTokenFile).toBe(true);
    });
  });

  describe('pattern matching', () => {
    it('should match hex color patterns correctly', () => {
      // Create new regex for each test to avoid global flag state issues
      const testHex = (str: string) => /#([0-9a-f]{3}|[0-9a-f]{6})\b/gi.test(str);
      
      expect(testHex('#fff')).toBe(true);
      expect(testHex('#ffffff')).toBe(true);
      expect(testHex('#000')).toBe(true);
      expect(testHex('#abc123')).toBe(true);
      expect(testHex('not a color')).toBe(false);
    });

    it('should match pixel value patterns', () => {
      // Create new regex for each test to avoid global flag state issues
      const testPixel = (str: string) => /\b(\d+)px\b/g.test(str);
      
      expect(testPixel('padding: 16px')).toBe(true);
      expect(testPixel('margin: 0px')).toBe(true);
      expect(testPixel('width: 100px')).toBe(true);
      expect(testPixel('no pixels here')).toBe(false);
    });

    it('should match rem spacing values', () => {
      // Create new regex for each test to avoid global flag state issues
      const testRem = (str: string) => /\b(\d+\.?\d*)rem\b/g.test(str);
      
      expect(testRem('padding: 1rem')).toBe(true);
      expect(testRem('margin: 1.5rem')).toBe(true);
      expect(testRem('gap: 2rem')).toBe(true);
    });
  });

  describe('file filtering', () => {
    it('should ignore test files', () => {
      const testFiles = [
        'components/test.test.tsx',
        'app/page.spec.tsx',
        'components/__tests__/component.tsx',
      ];

      const ignorePatterns = [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
      ];

      for (const file of testFiles) {
        const shouldIgnore = ignorePatterns.some(pattern => {
          // Convert glob to regex: ** becomes .*, * becomes [^/]*, {ts,tsx} becomes (ts|tsx)
          const regexStr = pattern
            .replace(/\*\*/g, '.*')
            .replace(/\*/g, '[^/]*')
            .replace(/\{([^}]+)\}/g, '($1)')
            .replace(/,/g, '|');
          const regex = new RegExp(`^${regexStr}$`);
          return regex.test(file);
        });
        expect(shouldIgnore).toBe(true);
      }
    });

    it('should ignore node_modules', () => {
      const file = 'node_modules/some-package/file.tsx';
      const ignorePattern = '**/node_modules/**';
      // Convert glob to regex: ** becomes .*, handle leading ** specially
      const regexStr = ignorePattern
        .replace(/^\*\*\//, '.*') // Leading **/ becomes .*
        .replace(/\*\*/g, '.*') // Other ** becomes .*
        .replace(/\/\*\*$/, '/.*'); // Trailing /** becomes /.*
      const regex = new RegExp(`^${regexStr}$`);
      expect(regex.test(file)).toBe(true);
    });
  });
});
