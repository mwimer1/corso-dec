import type { VariantProps } from '@/styles';
import { tv } from '@/styles';
import { navDesktopClasses, navMobileItemClasses } from "../shared/navbar-sizes";

const navItemVariants = tv({
  base: 'inline-flex items-center transition-colors duration-200 hover:underline underline-offset-4',
  variants: {
    state: {
      default: 'text-foreground hover:text-muted-foreground',
      active: 'text-primary',
      disabled: 'text-muted-foreground cursor-not-allowed opacity-50',
    },
    variant: {
      text: 'text-sm',
      button: 'rounded-[10px] px-3 py-2 text-sm max-lg:text-base font-medium',
      icon: 'p-2',
    },
    /* Framer-parity sizes for desktop/mobile list items */
    size: {
      navLink: navDesktopClasses(),
      mobileItem: navMobileItemClasses(),
    },
  },
  defaultVariants: {
    variant: 'text',
  },
});

export type NavItemVariantProps = VariantProps<typeof navItemVariants>;

export { navItemVariants };


