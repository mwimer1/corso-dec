// styles/ui/atoms/card.ts

import type { VariantProps } from '@/styles/utils';
import { tv } from '@/styles/utils';

/**
 * Card variant factory
 * – variant → elevation / border style
 * – padding → content spacing scale
 */
const cardVariants = tv({
  slots: {
    root: 'rounded-lg border border-border bg-surface text-foreground shadow-sm',
    header: 'flex flex-col space-y-sm p-6',
    title: 'text-lg font-semibold leading-none tracking-tight',
    description: 'text-sm text-muted-foreground',
    content: 'p-6 pt-0',
    footer: 'flex items-center p-6 pt-0',
  },
  variants: {
    variant: {
      default: {},
      elevated: {
        root: 'shadow-lg border-0',
      },
      ghost: {
        root: 'border-0 shadow-none',
      },
      highlight: {
        root: 'rounded-xl shadow-md',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type CardVariantProps = VariantProps<typeof cardVariants>;

export { cardVariants };

