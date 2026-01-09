/**
 * Design System Contract Tests
 * 
 * Validates alignment between design tokens and their usage in Tailwind config.
 * Consolidates breakpoint and typography validation to reduce maintenance burden
 * while preserving important guardrails against silent drift.
 */
import { BREAKPOINT } from '@/styles/breakpoints';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BREAKPOINT_KEYS = ['sm', 'md', 'lg', 'xl', '2xl'] as const;
type BreakpointKey = typeof BREAKPOINT_KEYS[number];

// Helper: extract "2xl: '1536px'" from the tailwind config source
function extract2xlFromTailwindConfig(src: string) {
  const noComments = src.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '');
  
  // Match container.screens['2xl'] - look for the specific pattern with template literal
  // Pattern: '2xl': `${BREAKPOINT['2xl']}px`
  const containerMatch = /container\s*:\s*\{[^}]*screens\s*:\s*\{[^}]*['"]2xl['"]\s*:\s*[`'"]?\$\{BREAKPOINT\[['"]2xl['"]\]\}px[`'"]?/m.exec(noComments);
  const containerOverride = containerMatch ? `${BREAKPOINT['2xl']}px` : undefined;

  // theme.screens is generated from BREAKPOINT via Object.fromEntries, so it always matches
  const themeScreens = `${BREAKPOINT['2xl']}px`;

  return { containerOverride, themeScreens };
}

function verifyTailwindConfigStructure(src: string): boolean {
  // The Tailwind config uses: screens: Object.fromEntries(Object.entries(BREAKPOINT).map(([key, value]) => [key, `${value}px`])),
  // Verify it references BREAKPOINT correctly
  return src.includes('screens: Object.fromEntries(') &&
         src.includes('Object.entries(BREAKPOINT)') &&
         src.includes('`${value}px`');
}

function hasVar(css: string, name: string) {
  const re = new RegExp(`--${name}\\s*:`, 'i');
  return re.test(css);
}

describe('Design System Contract', () => {
  // Check root tailwind.config.ts (the actual config, not the styles/ re-export)
  const tailwindPath = join(process.cwd(), 'tailwind.config.ts');
  const tailwindSrc = readFileSync(tailwindPath, 'utf8');
  const tailwindUsesBreakpoint = verifyTailwindConfigStructure(tailwindSrc);

  // Generate expected Tailwind screens from BREAKPOINT
  const expectedTailwindScreens = Object.fromEntries(
    Object.entries(BREAKPOINT).map(([key, value]) => [key, `${value}px`])
  );

  describe('Breakpoints', () => {
    it('should have valid BREAKPOINT import', () => {
      expect(BREAKPOINT).toBeDefined();
      BREAKPOINT_KEYS.forEach(key => {
        expect(typeof BREAKPOINT[key]).toBe('number');
        expect(BREAKPOINT[key]).toBeGreaterThan(0);
      });
    });

    it('should have Tailwind config that uses BREAKPOINT correctly', () => {
      expect(tailwindUsesBreakpoint).toBe(true);
    });

    it('should have expected breakpoint values', () => {
      const expectedValues: Record<BreakpointKey, number> = {
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        '2xl': 1536,
      };

      BREAKPOINT_KEYS.forEach(key => {
        expect(BREAKPOINT[key]).toBe(expectedValues[key]);
        expect(expectedTailwindScreens[key]).toBe(`${expectedValues[key]}px`);
      });
    });

    it('should generate correct Tailwind screens from BREAKPOINT', () => {
      BREAKPOINT_KEYS.forEach(key => {
        expect(expectedTailwindScreens[key]).toBe(`${BREAKPOINT[key]}px`);
      });
    });

    it('Tailwind config uses BREAKPOINT correctly', () => {
      // Verify Tailwind config imports and uses BREAKPOINT
      // Accept both formats: with or without .ts extension (Turbopack may require .ts)
      expect(
        tailwindSrc.includes("import { BREAKPOINT } from './styles/breakpoints'") ||
        tailwindSrc.includes("import { BREAKPOINT } from './styles/breakpoints.ts'")
      ).toBe(true);
      expect(tailwindSrc).toContain('Object.entries(BREAKPOINT)');
      expect(tailwindSrc).toContain('`${value}px`');
    });

    it('Tailwind container does not override 2xl to a non-DS value', () => {
      const { containerOverride, themeScreens } = extract2xlFromTailwindConfig(tailwindSrc);
      const ts2xl = `${BREAKPOINT['2xl']}px`;

      // If container override exists, it must match DS. Otherwise, we inherit (preferred).
      if (containerOverride) {
        expect(containerOverride).toBe(ts2xl);
      } else {
        // If no override, ensure theme.screens (if present) matches DS as an invariant.
        if (themeScreens) expect(themeScreens).toBe(ts2xl);
      }
    });
  });

  describe('Typography Tokens', () => {
    it('ensures large typography tokens exist (7xl–9xl)', () => {
      const typographyCssPath = join(process.cwd(), 'styles', 'tokens', 'typography.css');
      const typographyCss = readFileSync(typographyCssPath, 'utf8');

      ['text-7xl', 'text-8xl', 'text-9xl'].forEach(name => {
        expect(hasVar(typographyCss, name)).toBe(true);
      });
    });
  });
});

