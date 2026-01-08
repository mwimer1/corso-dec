import { tv, type VariantProps } from '@/styles';

const authCardVariants = tv({
  base: '',
  variants: {
    variant: {
      // Keep default/elevated as before and explicitly support `ghost` so
      // callers can pass `ghost` without remapping to `default` which
      // previously introduced an extra visible container effect.
      default: 'p-6 shadow-sm',
      elevated: 'p-8 shadow-xl',
      ghost: 'p-0 shadow-none border-0 bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export type AuthCardVariantProps = VariantProps<typeof authCardVariants>;

export { authCardVariants };


