import { tv } from '@/styles';
import type { VariantProps } from '@/styles';

/**
 * SkipNavLink variant factory – for accessibility skip navigation links.
 * Supports different positioning and styling options.
 */
const skipNavLinkVariants = tv({
  base: [
    'sr-only',
    'focus:not-sr-only focus:absolute focus:z-50',
    'focus:rounded focus:px-4 focus:py-2',
    'focus:text-sm focus:font-medium',
    'focus:transition-all focus:duration-200',
  ],
  variants: {
    position: {
      'top-left': 'focus:top-4 focus:left-4',
      'top-center': 'focus:top-4 focus:left-1/2 focus:-translate-x-1/2',
      'top-right': 'focus:top-4 focus:right-4',
    },
    theme: {
      primary: 'focus:bg-primary focus:text-primary-foreground',
      secondary: 'focus:bg-secondary focus:text-secondary-foreground',
      contrast: 'focus:bg-foreground focus:text-background',
    },
    size: {
      sm: 'focus:text-xs focus:px-3 focus:py-1.5',
      md: 'focus:text-sm focus:px-4 focus:py-2',
      lg: 'focus:text-base focus:px-5 focus:py-2.5',
    },
  },
  defaultVariants: {
    position: 'top-left',
    theme: 'primary',
    size: 'md',
  },
});

export type SkipNavLinkVariantProps = VariantProps<typeof skipNavLinkVariants>;
export { skipNavLinkVariants };

