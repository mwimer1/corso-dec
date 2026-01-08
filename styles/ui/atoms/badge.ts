import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

// Badge styles: small pill with color variants.
const badgeVariants = tv({
  base: 'inline-block rounded-lg px-2.5 py-1 text-xs font-semibold',
  variants: {
    color: {
      default: 'bg-muted text-muted-foreground',
      success: 'bg-success text-success-foreground',
      info: 'bg-info text-info-foreground',
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      warning: 'bg-warning text-warning-foreground',
      error: 'bg-error text-error-foreground',
    },
  },
  defaultVariants: {
    color: 'default',
  },
});

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export { badgeVariants };

