// styles/ui/shared/typography-variants.ts
import { tv } from '@/styles/utils';

/**
 * Responsive heading variants using canonical clamp() sizes.
 * - hero: clamp(2.5rem, calc(1.2rem + 6vw), 6.5rem)
 * - h1:   clamp(1.875rem, calc(1.2rem + 2.2vw), 3rem)
 */
/** @public — design-system typography primitive */
export const headingVariants = tv({
  base: 'font-bold leading-tight tracking-tight',
  variants: {
    size: {
      hero: 'text-[clamp(2.5rem,calc(1.2rem+6vw),6.5rem)]',
      h1: 'text-[clamp(1.875rem,calc(1.2rem+2.2vw),3rem)]',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    size: 'h1',
  },
});

// Removed unused export: HeadingVariantProps
// This type was flagged as unused by the audit

/*
export type HeadingVariantProps = VariantProps<typeof headingVariants>;
*/

/**
 * Utility: dashed underline text decoration (for emphasized labels or links)
 */
// Removed unused export: dashedUnderline
// This constant was flagged as unused by the audit

/*
const dashedUnderline = "underline decoration-dashed underline-offset-4";
*/



