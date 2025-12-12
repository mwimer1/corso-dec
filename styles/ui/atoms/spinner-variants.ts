import { sizeHW } from '@/styles/shared-variants';
import { tv, type VariantProps } from '@/styles/utils';

const spinnerVariants = tv({
  base: 'animate-spin motion-reduce:animate-none motion-reduce:transition-none',
  variants: {
    size: sizeHW,
    variant: {
      default: 'text-primary',
      secondary: 'text-[hsl(var(--surface-contrast))]',
      ghost: 'text-foreground',
    },
  },
  defaultVariants: {
    size: 'md',
    variant: 'default',
  },
});

export type SpinnerVariantProps = VariantProps<typeof spinnerVariants>;
export { spinnerVariants };


