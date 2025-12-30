// styles/ui/atoms/input.ts
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

// Input variant with focus-visible ring and optional ghost style.
const inputVariants = tv({
  base: [
    'flex w-full rounded-md',
    'transition-colors duration-200',
    'focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
    'bg-background border border-input placeholder:text-muted-foreground',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  ],
  variants: {
    variant: {
      default: 'focus-visible:ring-ring focus-visible:ring-offset-background',
      ghost: 'border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent',
    },
    state: {
      default: '',
      error: 'border-destructive focus-visible:ring-destructive',
      success: 'border-green-500 focus-visible:ring-green-500',
    },
    size: {
      sm: 'h-8 px-2 text-sm',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    },
  },
  defaultVariants: {
    variant: 'default',
    state: 'default',
    size: 'md',
  },
});

export type InputVariantProps = VariantProps<typeof inputVariants>;

export { inputVariants };


