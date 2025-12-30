// FILE: styles/primitives/progress.ts
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

const progressVariants = tv({
  base: 'relative w-full overflow-hidden rounded-full bg-secondary',
  variants: {
    size: {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export type ProgressVariantProps = VariantProps<typeof progressVariants>;

export { progressVariants };


