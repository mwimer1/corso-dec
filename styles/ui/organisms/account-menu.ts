// styles/organisms/account-menu.ts
import { tv, type VariantProps } from '@/styles';

const accountMenuVariants = tv({
  base: 'flex items-center',
  variants: {
    // No variants needed as this is a wrapper around a third-party component.
    // This file exists for consistency with the component architecture.
  },
  defaultVariants: {},
});

export type AccountMenuVariantProps = VariantProps<typeof accountMenuVariants>; 

export { accountMenuVariants };

