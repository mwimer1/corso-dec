// styles/organisms/file-upload.ts
import { roundedVariants } from '@/styles/shared-variants';
import { tv } from '@/styles/utils';

const fileUploadVariants = tv({
  base: 'relative flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface p-8 transition-colors duration-200 ease-in-out hover:border-primary/50',
  variants: {
    state: {
      idle: 'border-border',
      dragging: 'border-primary bg-primary/10',
      error: 'border-danger bg-danger/10 text-danger',
    },
    size: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    rounded: { ...roundedVariants, full: 'rounded-[10px]' },
  },
  defaultVariants: {
    state: 'idle',
    size: 'lg',
    rounded: 'lg',
  },
});
export type { VariantProps } from '@/styles/utils';
export { fileUploadVariants };


