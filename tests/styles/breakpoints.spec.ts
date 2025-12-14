import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BREAKPOINT } from '@/styles/breakpoints';

// Helper: extract "2xl: '1536px'" from the tailwind config source
function extract2xlFromTailwindConfig(src: string) {
  const noComments = src.replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '');
  const containerOverride =
    /container\s*:\s*\{[\s\S]*?screens\s*:\s*\{[\s\S]*?['"]2xl['"]\s*:\s*['"]([^'"]+)['"][\s\S]*?\}[\s\S]*?\}/m.exec(
      noComments
    )?.[1];

  const themeScreens =
    /theme\s*:\s*\{[\s\S]*?screens\s*:\s*\{[\s\S]*?['"]2xl['"]\s*:\s*['"]([^'"]+)['"][\s\S]*?\}[\s\S]*?\}/m.exec(
      noComments
    )?.[1];

  return { containerOverride, themeScreens };
}

describe('Design system breakpoints alignment', () => {
  const tailwindPath = join(process.cwd(), 'styles', 'tailwind.config.ts');

  const tailwindSrc = readFileSync(tailwindPath, 'utf8');

  it('Tailwind config uses BREAKPOINT correctly', () => {
    // Verify Tailwind config imports and uses BREAKPOINT
    expect(tailwindSrc).toContain("import { BREAKPOINT } from './breakpoints'");
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
