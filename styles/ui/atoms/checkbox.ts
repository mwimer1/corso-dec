import type { VariantProps } from '@/styles/utils';
import { tv } from '@/styles/utils';

// Inlined from input-control-base.ts and input-variants.ts
const inputControlBase = tv({
  base:
    'inline-block border border-border focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
  variants: {
    shape: {
      square: 'rounded-sm',
      circle: 'rounded-[10px]',
    },
  },
  defaultVariants: {
    shape: 'square',
  },
});

const focusRingColorVariants = {
  primary: 'focus-visible:ring-primary',
  secondary: 'focus-visible:ring-secondary',
  success: 'focus-visible:ring-success',
  warning: 'focus-visible:ring-warning',
  error: 'focus-visible:ring-danger',
} as const;

const disabledControlVariant = {
  true: 'opacity-50 cursor-not-allowed',
} as const;

// Checkbox styles: uses accent-color for checkmark, design tokens for border.
const checkboxVariants = tv({
  base: inputControlBase({ shape: 'square' }),
  variants: {
    color: focusRingColorVariants,
    disabled: disabledControlVariant,
  },
  defaultVariants: {
    color: 'primary',
  },
});

export type CheckboxVariantProps = VariantProps<typeof checkboxVariants>;

export { checkboxVariants };


