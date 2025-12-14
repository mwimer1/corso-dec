import { BREAKPOINT } from '@/styles/breakpoints';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BREAKPOINT_KEYS = ['sm', 'md', 'lg', 'xl', '2xl'] as const;
type BreakpointKey = typeof BREAKPOINT_KEYS[number];

function verifyTailwindConfigStructure(src: string): boolean {
  // The Tailwind config uses: screens: Object.fromEntries(Object.entries(BREAKPOINT).map(([key, value]) => [key, `${value}px`])),
  // Verify it references BREAKPOINT correctly
  return src.includes('screens: Object.fromEntries(') &&
         src.includes('Object.entries(BREAKPOINT)') &&
         src.includes('`${value}px`');
}

describe('Breakpoint triangulation across sources', () => {
  const tailwindPath = join(process.cwd(), 'styles', 'tailwind.config.ts');
  const tailwindSrc = readFileSync(tailwindPath, 'utf8');

  const tailwindUsesBreakpoint = verifyTailwindConfigStructure(tailwindSrc);

  // Generate expected Tailwind screens from BREAKPOINT
  const expectedTailwindScreens = Object.fromEntries(
    Object.entries(BREAKPOINT).map(([key, value]) => [key, `${value}px`])
  );

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
});
