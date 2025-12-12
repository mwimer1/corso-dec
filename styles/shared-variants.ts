// styles/shared-variants.ts
// Centralized, reusable variant maps for Tailwind Variants factories

/** Rounded scale map used across multiple components */
export const roundedVariants = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
} as const;

/** Text alignment map used for headers, sections, etc. */
export const textAlignVariants = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

/** Flex justify alignment map used for legends/axis alignments */
export const flexJustifyVariants = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
} as const;

/** Shared text size scale (sm/md/lg)
 * Matches existing usage across atoms/molecules: sm→text-xs, md→text-sm, lg→text-base
 */
export const textTri = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const;

// Size variants used by interactive components (source of truth in utils)
export const sizeHW = {
  sm: 'h-ms w-ms',
  md: 'h-md w-md',
  lg: 'h-ml w-ml',
} as const;

// Layering note: utils must not import from ui.

