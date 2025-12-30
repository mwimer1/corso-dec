// styles/ui/shared/container-helpers.ts
import { tv } from '@/styles';
import { containerMaxWidthVariants } from './container-base';

// Inlined from container-padding.ts
const containerPadding = {
  none: '',
  sm: 'px-4',
  md: 'px-4 sm:px-6',
  lg: 'px-4 sm:px-6 lg:px-8',
} as const;

/**
 * Container with padding helper
 * Combines max-width, centering, and padding variants with sensible defaults.
 */
/** @public — section/container helper used by multiple marketing sections */
export const containerWithPaddingVariants = tv({
  extend: containerMaxWidthVariants,
  base: 'mx-auto w-full',
  variants: {
    padding: containerPadding,
  },
  defaultVariants: {
    maxWidth: 'xl',
    centered: true,
    padding: 'lg',
  },
});



