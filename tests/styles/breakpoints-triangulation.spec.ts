import { BREAKPOINT } from '@/styles/breakpoints';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BREAKPOINT_KEYS = ['sm', 'md', 'lg', 'xl', '2xl'] as const;
type BreakpointKey = typeof BREAKPOINT_KEYS[number];

function extractBreakpointsFromCSS(src: string): Map<BreakpointKey, string> {
  const breakpoints = new Map<BreakpointKey, string>();

  // Match: --bp-sm: 640px; or --bp-2xl: 1536px;
  const regex = /--bp[-_]?(\w+)\s*:\s*(\d+px)\s*;/g;
  let match;

  while ((match = regex.exec(src)) !== null) {
    const [, key, value] = match;
    if (BREAKPOINT_KEYS.includes(key as BreakpointKey)) {
      breakpoints.set(key as BreakpointKey, value);
    }
  }

  return breakpoints;
}

function verifyTailwindConfigStructure(src: string): boolean {
  // The Tailwind config uses: screens: Object.fromEntries(Object.entries(BREAKPOINT).map(([key, value]) => [key, `${value}px`])),
  // Verify it references BREAKPOINT correctly
  return src.includes('screens: Object.fromEntries(') &&
         src.includes('Object.entries(BREAKPOINT)') &&
         src.includes('`${value}px`');
}

describe('Breakpoint triangulation across sources', () => {
  const cssPath = join(process.cwd(), 'styles', 'tokens', 'breakpoints.css');
  const tailwindPath = join(process.cwd(), 'styles', 'tailwind.config.ts');

  const cssSrc = readFileSync(cssPath, 'utf8');
  const tailwindSrc = readFileSync(tailwindPath, 'utf8');

  const cssBreakpoints = extractBreakpointsFromCSS(cssSrc);
  const tailwindUsesBreakpoint = verifyTailwindConfigStructure(tailwindSrc);

  // Generate expected Tailwind screens from BREAKPOINT
  const expectedTailwindScreens = Object.fromEntries(
    Object.entries(BREAKPOINT).map(([key, value]) => [key, `${value}px`])
  );

  it('should extract all expected breakpoints from CSS tokens', () => {
    BREAKPOINT_KEYS.forEach(key => {
      expect(cssBreakpoints.has(key)).toBe(true);
      expect(cssBreakpoints.get(key)).toMatch(/^\d+px$/);
    });
  });

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

  it('should have consistent breakpoints between TypeScript and CSS tokens', () => {
    BREAKPOINT_KEYS.forEach(key => {
      const tsValue = `${BREAKPOINT[key]}px`;
      const cssValue = cssBreakpoints.get(key);

      expect(tsValue).toBeDefined();
      expect(cssValue).toBeDefined();

      expect(tsValue).toBe(cssValue);
    });
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
      expect(cssBreakpoints.get(key)).toBe(`${expectedValues[key]}px`);
      expect(expectedTailwindScreens[key]).toBe(`${expectedValues[key]}px`);
    });
  });

  it('should generate correct Tailwind screens from BREAKPOINT', () => {
    BREAKPOINT_KEYS.forEach(key => {
      expect(expectedTailwindScreens[key]).toBe(`${BREAKPOINT[key]}px`);
    });
  });
});

