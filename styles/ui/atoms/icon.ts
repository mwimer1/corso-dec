import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

const iconVariants = tv({
  base: 'inline-block',
  variants: {
    size: {
      xs: 'w-ms h-ms',
      sm: 'w-md h-md',
      md: 'w-lg h-lg',
      lg: 'w-xl h-xl',
      xl: 'w-3xl h-3xl',
    },
    intent: {
      default: 'text-current',
      primary: 'text-[hsl(var(--primary))]',
      secondary: 'text-[hsl(var(--secondary))]',
      success: 'text-[hsl(var(--success))]',
      warning: 'text-[hsl(var(--warning))]',
      danger: 'text-[hsl(var(--danger))]',
      muted: 'text-[hsl(var(--muted))]',
    },
  },
  defaultVariants: {
    size: 'md',
    intent: 'default',
  },
});

export type IconVariantProps = VariantProps<typeof iconVariants>;

export { iconVariants };

