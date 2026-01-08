import { containerMaxWidthVariants, containerWithPaddingVariants } from '@/styles/ui/shared';
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';
/**
 * PricingGrid variant factory – for responsive pricing plan layouts.
 * Supports different grid configurations and spacing options.
 */
const pricingGridVariants = tv({
  base: 'grid',
  variants: {
    columns: {
      auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      single: 'grid-cols-1',
      double: 'grid-cols-1 sm:grid-cols-2',
      triple: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      tripleNoWrap: 'grid-cols-1 lg:grid-cols-3', // Skip sm 2-col breakpoint to prevent 2+1 layout for exactly 3 cards
      quad: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    },
    spacing: {
      tight: 'gap-4',
      normal: 'gap-6',
      loose: 'gap-8',
      xl: 'gap-10',
    },
    alignment: {
      start: 'justify-items-start',
      center: 'justify-items-center',
      end: 'justify-items-end',
      stretch: 'justify-items-stretch',
    },
    responsive: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    // Responsive adjustments for different column counts
    {
      columns: 'quad',
      responsive: true,
      class: 'xl:grid-cols-4',
    },
    {
      columns: 'triple',
      responsive: true,
      class: 'xl:grid-cols-3',
    },
  ],
  defaultVariants: {
    columns: 'auto',
    spacing: 'normal',
    alignment: 'stretch',
    responsive: true,
  },
});

/**
 * PricingGrid container variants for different contexts
 * 
 * @description Uses shared containerMaxWidthVariants for consistent max-width patterns
 */
const pricingGridContainerVariants = tv({
  extend: containerWithPaddingVariants,
  base: '',
  variants: {
    context: {
      marketing: 'my-8 pt-4',
      dashboard: 'p-6',
      modal: 'p-4',
      embedded: '',
    },
    // inherit maxWidth + padding defaults
    maxWidth: {
      none: '',
      sm: containerMaxWidthVariants({ maxWidth: '2xl', centered: true }),
      md: containerMaxWidthVariants({ maxWidth: '4xl', centered: true }),
      lg: containerMaxWidthVariants({ maxWidth: '6xl', centered: true }),
      xl: containerMaxWidthVariants({ maxWidth: '7xl', centered: true }),
    },
  },
  defaultVariants: {
    context: 'marketing',
    maxWidth: 'lg',
  },
});

export type PricingGridVariantProps = VariantProps<typeof pricingGridVariants>;
export type PricingGridContainerVariantProps = VariantProps<typeof pricingGridContainerVariants>;

export { pricingGridContainerVariants, pricingGridVariants };


