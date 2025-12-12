import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Helper: extract "2xl: '1536px'" and/or container override from the tailwind config source
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

// Helper: extract BREAKPOINT['2xl'] = 1536 from TS object literal (numeric value, no px)
function extract2xlFromBreakpointsTS(src: string) {
  const m = /'2xl'\s*:\s*(\d+),?/.exec(src);
  return m?.[1] ? `${m[1]}px` : '';
}

// Helper: extract --bp-2xl: 1536px; from CSS tokens
function extract2xlFromBreakpointTokensCSS(src: string) {
  const m = /--bp-2xl\s*:\s*(\d+px)\s*;/i.exec(src);
  return (m?.[1] || '').trim();
}

describe('Design system breakpoints alignment', () => {
  const tailwindPath = join(process.cwd(), 'styles', 'tailwind.config.ts');
  const breakpointsTsPath = join(process.cwd(), 'styles', 'breakpoints.ts');
  const tokensCssPath = join(process.cwd(), 'styles', 'tokens', 'breakpoints.css');

  const tailwindSrc = readFileSync(tailwindPath, 'utf8');
  const breakpointsTs = readFileSync(breakpointsTsPath, 'utf8');
  const tokensCss = readFileSync(tokensCssPath, 'utf8');

  it('2xl in DS TS and tokens CSS match', () => {
    const ts2xl = extract2xlFromBreakpointsTS(breakpointsTs);
    const css2xl = extract2xlFromBreakpointTokensCSS(tokensCss);
    expect(ts2xl).toBeTruthy();
    expect(css2xl).toBeTruthy();
    expect(ts2xl).toBe(css2xl);
  });

  it('Tailwind container does not override 2xl to a non-DS value', () => {
    const { containerOverride, themeScreens } = extract2xlFromTailwindConfig(tailwindSrc);
    const ts2xl = extract2xlFromBreakpointsTS(breakpointsTs);

    // If container override exists, it must match DS. Otherwise, we inherit (preferred).
    if (containerOverride) {
      expect(containerOverride).toBe(ts2xl);
    } else {
      // If no override, ensure theme.screens (if present) matches DS as an invariant.
      if (themeScreens) expect(themeScreens).toBe(ts2xl);
    }
  });
});

