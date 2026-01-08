import { textTri } from '@/styles/shared-variants';
import { tv } from '@/styles';

const faqVariants = tv({
  base: '',
  variants: {
    variant: {
      default: '',
      compact: 'space-y-md',
      spacious: 'space-y-xl',
    },
    size: textTri,
    spacing: {
      tight: 'space-y-sm',
      normal: 'space-y-md',
      loose: 'space-y-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    spacing: 'normal',
  },
});
export type { VariantProps } from '@/styles';
export { faqVariants };


