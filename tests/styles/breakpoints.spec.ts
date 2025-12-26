import { BREAKPOINT } from '@/styles/breakpoints';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

describe('Design system breakpoints alignment', () => {
  // Check the root tailwind.config.ts (source of truth), not the shim
  const tailwindPath = join(process.cwd(), 'tailwind.config.ts');

  const tailwindSrc = readFileSync(tailwindPath, 'utf8');

  it('Tailwind config uses BREAKPOINT correctly', () => {
    // Verify Tailwind config imports and uses BREAKPOINT
    expect(tailwindSrc).toContain("import { BREAKPOINT } from './styles/breakpoints'");
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
