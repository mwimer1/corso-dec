import { tv } from '@/styles';
import { navDesktopClasses } from "../shared/navbar-sizes";

/**
 * Navbar layout slots mapping landing CSS module semantics to tokenized classes.
 * Keeps exact hover/focus/visibility behaviors.
 */
const navbarLayout = tv({
  slots: {
    root: [
      'bg-[hsl(var(--surface))] py-xs',
      'transition-all duration-200 ease-in-out',
    ],
    container: [
      'flex items-center justify-between w-full flex-1',
      'h-[calc(var(--space-4xl)+0.5rem)]',
      'max-w-[var(--container-7xl)] mx-auto',
    ],
    left: ['flex items-center gap-lg'],
    logoLink: [
      'inline-flex items-center gap-sm px-sm py-xs mr-md outline-none',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[hsl(var(--ring))] focus-visible:outline-offset-2',
    ],
    right: ['hidden md:flex items-center gap-ms'],
    mobileTriggerContainer: ['ml-auto md:hidden'],
    desktopNav: ['hidden md:flex items-center gap-md'],
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
    mobileMenu: [
      'absolute left-0 top-[70px] w-full bg-background/95 backdrop-blur-sm md:hidden',
      'flex flex-col items-center gap-lg p-lg',
      'pointer-events-none opacity-0 -translate-y-1 transition will-change-transform',
      'data-[state=open]:pointer-events-auto data-[state=open]:opacity-100 data-[state=open]:translate-y-0',
    ],
    mobileNav: ['flex flex-col items-center gap-md'],
    mobileNavItem: [
      'text-foreground text-base px-md py-sm',
      'transition-colors duration-200',
      'hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
    ],
    button: ['min-h-[44px] py-sm px-md text-base font-medium'],
    sentinel: ['absolute inset-x-0 top-0 h-[150px] pointer-events-none -z-[1]'],
  },
});

export { navbarLayout };



