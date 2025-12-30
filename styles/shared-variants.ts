/**
 * Shared variant value maps for reuse across multiple component variants.
 * 
 * These maps provide standard Tailwind class sets for common variant patterns
 * (e.g., border radius, text alignment, sizing) to ensure consistency across
 * the design system. They are intended to be used in tailwind-variants (`tv()`)
 * definitions to avoid duplication and maintain a single source of truth.
 * 
 * @example
 * ```ts
 * import { roundedVariants, textTri } from '@/styles/shared-variants';
 * 
 * const myComponentVariants = tv({
 *   variants: {
 *     rounded: roundedVariants,
 *     size: textTri,
 *   },
 * });
 * ```
 * 
 * @note Components should not import these directly. Use them via component
 * variants that consume these maps in their variant definitions.
 */

/** Border radius utility classes for none/sm/md/lg rounded corners. */
export const roundedVariants = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
} as const;

/** Text alignment utility classes (left, center, right) for headers, sections, and content blocks. */
export const textAlignVariants = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

/** Flex justify-content utility classes (start, center, end) for flex container alignment, commonly used in legends and axis alignments. */
export const flexJustifyVariants = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
} as const;

/** 
 * Shared text size scale (sm/md/lg) mapping to Tailwind text size classes.
 * Matches existing usage across atoms/molecules: sm→text-xs, md→text-sm, lg→text-base.
 * Used for consistent typography sizing across label, empty state, and other text components.
 */
export const textTri = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const;

/** 
 * Height and width size variants used by interactive components (e.g., spinners, icons).
 * Maps sm/md/lg to custom height/width token classes (h-ms w-ms, h-md w-md, h-ml w-ml).
 * Source of truth for consistent sizing across interactive elements.
 */
export const sizeHW = {
  sm: 'h-ms w-ms',
  md: 'h-md w-md',
  lg: 'h-ml w-ml',
} as const;

// Layering note: utils must not import from ui.

