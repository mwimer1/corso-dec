// styles/ui/shared/container-base.ts
import { tv } from '@/styles';

/**
 * Container Max Width Variant Factory
 * 
 * Shared max-width variants for container components across the design system.
 * Consolidates repeated max-width patterns from full-width-section, dialog, pricing-grid,
 * tab-switcher, and other components.
 * 
 * @description Centralized max-width patterns for consistent container sizing
 * @example
 * ```tsx
 * const containerClasses = containerMaxWidthVariants({ 
 *   maxWidth: 'xl',
 *   centered: true 
 * });
 * ```
 */
const containerMaxWidthVariants = tv({
  base: 'w-full',
  variants: {
    maxWidth: {
      none: '',
      xs: 'max-w-xs',
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl',
      full: 'max-w-full',
      // Custom fixed widths
      dashboard: 'max-w-[1600px]',
      // Responsive viewport-based
      viewport: 'max-w-screen',
      viewportLarge: 'max-w-screen',
    },
    centered: {
      true: 'mx-auto',
      false: '',
    },
    responsive: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    // Responsive adjustments for viewport-based max-widths
    {
      maxWidth: 'viewport',
      responsive: true,
      class: 'sm:px-md lg:px-2xl',
    },
    {
      maxWidth: 'viewportLarge',
      responsive: true,
      class: 'sm:px-xl lg:px-3xl',
    },
  ],
  defaultVariants: {
    maxWidth: 'none',
    centered: false,
    responsive: false,
  },
});


export { containerMaxWidthVariants };


