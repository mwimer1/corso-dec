// lib/shared/utils/layout.ts
// Description: Layout utilities for consistent container sizing across components

/**
 * Standard max-width classes for responsive container sizing.
 * Used across components for consistent layout behavior.
 */
export const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
} as const;

/**
 * Type for max-width keys
 */
export type MaxWidthKey = keyof typeof maxWidthClasses;

/**
 * Get the CSS class for a given max-width key
 */
export function getMaxWidthClass(key: MaxWidthKey): string {
  return maxWidthClasses[key];
} 

