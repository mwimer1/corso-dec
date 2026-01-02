import { tv } from '@/styles';

const navbarStyleVariants = tv({
  slots: {
    navbar: [
      'bg-surface px-0',
      'transition-all duration-200 ease-in-out',
      'relative z-40'
    ],
    navbarScrolled: 'shadow-sm',
    container: [
      'flex h-[calc(var(--space-4xl)+0.5rem)] items-center justify-between',
      'max-w-7xl mx-auto'
    ],
    left: 'flex items-center gap-lg',
    logoLink: [
      'inline-flex items-center gap-sm',
      'px-xs py-sm mr-md',
      'outline-none',
      'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
      'rounded-sm'
    ],
    right: 'hidden md:flex items-center gap-sm',
    mobile: 'ml-auto md:hidden',
    desktopNav: 'hidden md:flex items-center gap-md',
    navItem: [
      // Button-like container (match CTA geometry) but visually "invisible" by default
      'inline-flex items-center justify-center whitespace-nowrap',
      'text-foreground text-base font-medium',
      'min-h-[44px] px-md py-sm',
      'rounded-[10px]',
      'border-2 border-transparent',
      'bg-transparent',
      'transition-colors duration-150 ease-in-out',
      'no-underline',
      // Hover affordance (light grey)
      'hover:bg-muted hover:text-foreground',
      'active:bg-muted-foreground/12',
      // Accessible focus ring (match Button focus pattern)
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:no-underline',
    ],
    mobileMenu: [
      'absolute left-0 top-[70px] w-full',
      'bg-background/95 backdrop-blur-[8px]',
      'flex flex-col items-center gap-lg',
      'px-lg py-lg',
      'pointer-events-none opacity-0 -translate-y-1',
      'transition-all duration-200 ease-in-out',
      'will-change-transform'
    ],
    mobileMenuOpen: 'pointer-events-auto opacity-100 translate-y-0',
    mobileNav: 'flex flex-col items-center gap-md',
    mobileNavItem: [
      'text-foreground text-base',
      'px-md py-sm',
      'transition-all duration-200 ease-in-out',
      'hover:bg-accent hover:text-accent-foreground',
      'focus:bg-accent focus:text-accent-foreground'
    ],
    sentinel: 'absolute top-0 left-0 right-0 h-[150px] pointer-events-none -z-10',
    button: [
      'min-h-[44px] px-md py-sm',
      'text-base font-medium',
      'focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
    ]
  },
  variants: {
    scrolled: {
      true: {},
      false: {}
    },
    mode: {
      landing: {},
      app: {},
      minimal: {}
    }
  },
  compoundVariants: [
    {
      scrolled: true,
      class: {
        navbar: 'shadow-sm'
      }
    }
  ],
  defaultVariants: {
    scrolled: false,
    mode: 'landing'
  },
});

export { navbarStyleVariants };


