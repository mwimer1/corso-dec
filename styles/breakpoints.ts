// styles/breakpoints.ts
// Source of truth for named viewport breakpoints and helpers

export const BREAKPOINT = {
  xs: 0,     // mobile-first baseline
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// BreakpointName type removed - unused in application code

export const px = (value: number): string => `${value}px`;

// Media query helpers
export const mq = {
  up: (bp: keyof typeof BREAKPOINT): string => `(min-width: ${px(BREAKPOINT[bp])})`,
  // Use a small epsilon to avoid overlapping ranges with adjacent up() queries
  down: (bp: keyof typeof BREAKPOINT): string => `(max-width: ${px(BREAKPOINT[bp] - 0.02)})`,
  between: (a: keyof typeof BREAKPOINT, b: keyof typeof BREAKPOINT): string =>
    `(min-width: ${px(BREAKPOINT[a])}) and (max-width: ${px(BREAKPOINT[b] - 0.02)})`,
} as const;

