import { tv } from '@/styles';
import { navDesktopClasses } from "../shared/navbar-sizes";

/**
 * Consolidated navbar styling system.
 * Merges layout and visual styling into a single source of truth.
 */
const navbarStyleVariants = tv({
  slots: {
    // Root navbar container (header element)
    navbar: [
      'bg-surface px-0',
      'border-b border-border', // Divider line - moved from PublicLayout
      'transition-all duration-200 ease-in-out',
      'relative z-40'
    ],
    navbarScrolled: 'shadow-sm',
    
    // Container for navbar content
    container: [
      'flex items-center justify-between w-full flex-1',
      'h-[calc(var(--space-4xl)+0.5rem)]',
      'max-w-[var(--container-7xl)] mx-auto',
    ],
    
    // Left cluster: Logo + primary navigation
    left: ['flex items-center gap-lg'],
    
    // Logo link styling
    logoLink: [
      'inline-flex items-center gap-sm px-sm py-xs mr-md outline-none',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2',
    ],
    
    // Right cluster: auth actions
    right: ['hidden md:flex items-center gap-sm'],
    
    // Mobile trigger container
    mobileTriggerContainer: ['ml-auto md:hidden'],
    
    // Desktop navigation container
    desktopNav: ['hidden md:flex items-center gap-md'],
    
    // Desktop nav item styling (unused in current implementation, kept for compatibility)
    desktopNavItem: [
      'relative inline-flex cursor-pointer items-center justify-center text-nowrap',
      'text-foreground font-semibold no-underline',
      `${navDesktopClasses()}`,
      'gap-x-1.5',
      'transition-colors duration-400 ease-in-out hover:duration-150 active:duration-50',
      'hover:bg-[hsl(var(--muted)/0.40)] hover:text-foreground',
      'active:bg-[hsl(var(--muted-foreground)/0.12)]',
      'focus-visible:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    ],
    
    // Nav item styling (used by MenuPrimaryLinks)
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
    
    // Mobile menu container
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
    
    // Mobile navigation container
    mobileNav: ['flex flex-col items-center gap-md'],
    
    // Mobile nav item styling
    mobileNavItem: [
      'text-foreground text-base',
      'px-md py-sm',
      'transition-all duration-200 ease-in-out',
      'hover:bg-accent hover:text-accent-foreground',
      'focus:bg-accent focus:text-accent-foreground'
    ],
    
    // Sentinel for scroll detection
    sentinel: ['absolute inset-x-0 top-0 h-[150px] pointer-events-none -z-[1]'],
    
    // Button styling (used for CTAs)
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
