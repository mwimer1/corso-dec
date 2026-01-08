import type { VariantProps } from '@/styles/utils';
import { tv } from '@/styles/utils';

// Removed unused constant: navbarVariants
// This variant was flagged as unused by the audit

const navbarLogoVariants = tv({
  base: 'inline-flex items-center gap-sm px-sm py-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm [&_img]:w-auto',
  variants: {
    size: {
      responsive: '[&_img]:h-[50px] [&_img]:w-[175px] max-[650px]:[&_img]:h-[45px] max-[650px]:[&_img]:w-[155px] max-[400px]:[&_img]:h-[45px] max-[400px]:[&_img]:w-[135px]',
    },
  },
  defaultVariants: {
    size: 'responsive',
  },
});

export type NavbarLogoVariantProps = VariantProps<typeof navbarLogoVariants>;

export { navbarLogoVariants };


