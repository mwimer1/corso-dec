import { textTri } from '@/styles/shared-variants';
import type { VariantProps } from '@/styles/utils';
import { tv } from '@/styles/utils';

const labelVariants = tv({
  base: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  variants: {
    size: textTri,
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
    required: {
      true: 'after:content-["*"] after:ml-xxs after:text-[hsl(var(--danger))]',
      false: '',
    },
  },
  defaultVariants: {
    size: 'md',
    weight: 'medium',
    required: false,
  },
});

export type LabelVariantProps = VariantProps<typeof labelVariants>;

export { labelVariants };


