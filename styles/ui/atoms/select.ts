// styles/components/ui/atoms/select.ts
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

const selectVariants = tv({
  base: [
    'inline-flex items-center w-full rounded-md',
    'transition-colors duration-200',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  variants: {
    size: {
      sm: 'h-8 px-2 text-sm',
      md: 'h-10 px-3 text-sm',
      lg: 'h-12 px-4 text-base',
    },
    state: {
      default: 'border border-input bg-background',
      error: 'border border-destructive',
      success: 'border border-green-500',
    },
  },
  defaultVariants: {
    size: 'md',
    state: 'default',
  },
});

export type SelectVariantProps = VariantProps<typeof selectVariants>;

export { selectVariants };


