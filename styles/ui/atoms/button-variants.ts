import { tv, type VariantProps } from '@/styles/utils';
import { navDesktopClasses, navMobileCtaClasses, navMobileItemClasses } from "../shared/navbar-sizes";

// Consistent solid-light button on surface backgrounds (token-first; no hardcoded white)
const SOLID_SURFACE_WITH_BORDER =
  'border-2 border-border bg-[hsl(var(--surface))] text-foreground ' +
  "hover:bg-[hsl(var(--surface)/0.98)] active:bg-[hsl(var(--surface)/0.96)] " +
  'hover:border-foreground focus-visible:border-foreground active:border-foreground';

/** 🟢 Atom Variant: Button (variant · size · fullWidth). */
const buttonVariants = tv({
  base: [
    'inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm max-lg:text-base font-medium ring-offset-background transition-colors duration-400 ease-in-out hover:duration-150 active:duration-50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'gap-x-1.5 max-lg:gap-x-2', // Added gap handling with responsive behavior
  ],
  variants: {
    /* visual intent */
    variant: {
      /* Primary CTA: Dark background with white text, border, and enhanced hover effects */
      default: [
        'bg-[hsl(var(--foreground-strong))] text-background hover:bg-[hsl(var(--foreground-strong)/0.92)] active:bg-[hsl(var(--foreground-strong)/0.88)]',
        'border-2 border-[hsl(var(--foreground-strong))]', // Added border matching background
        'hover:border-[hsl(var(--foreground-strong)/0.92)] active:border-[hsl(var(--foreground-strong)/0.88)]', // Enhanced border hover effects
      ].join(' '),
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      // Consolidated neutral outline style (white background, gray border)
      outline:
        'border-2 border-border bg-transparent text-foreground hover:bg-accent/15 hover:border-foreground/60 active:bg-accent/25 active:border-foreground/70',
      /* Secondary = solid-light (token-first) */
      secondary: SOLID_SURFACE_WITH_BORDER,

      /**
       * White background variant for use on colored backgrounds
       * Provides high contrast and visibility on primary/brand backgrounds
       */
      /**
       * Solid "white" background for use on colored/brand backgrounds
       * Now token-first and consistent with secondary (keeps border + font).
       */
      whiteSolid: SOLID_SURFACE_WITH_BORDER,
      /**
       * Navbar-specific variants (do NOT use accent/blue hovers here)
       * These are identical in geometry to nav pills but neutral in hover states.
       */
      navPrimary: [
        'bg-[hsl(var(--foreground-strong))] text-background hover:bg-[hsl(var(--foreground-strong)/0.92)] active:bg-[hsl(var(--foreground-strong)/0.88)]',
        'border-2 border-[hsl(var(--foreground-strong))]', // Added border matching background
        'hover:border-[hsl(var(--foreground-strong)/0.92)] active:border-[hsl(var(--foreground-strong)/0.88)]', // Enhanced border hover effects
      ].join(' '),
      /* Navbar outline = same solid-light spec; sizing comes from size: 'navLink' */
      navSecondary: SOLID_SURFACE_WITH_BORDER,
      ghost: 'hover:bg-secondary hover:text-secondary-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
      /* MVP aliases removed - use variant "cta" instead */
      /** Marketing CTA: extends shared CTA base for consistency */
      cta: '',
    },
    /* sizing */
    size: {
      default: 'h-8 px-3', // Reduced height by 4px total (2px top+bottom)
      sm: 'h-7 px-2.5', // Slightly smaller for consistency
      lg: 'h-10.5 px-3.5', // Reduced height by 4px total (2px top+bottom)
      icon: 'h-9 w-9',
      /* Framer-parity navbar sizes (centralized) */
      navLink: navDesktopClasses(),
      mobileItem: navMobileItemClasses(),
      mobileCta: navMobileCtaClasses(),
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  compoundVariants: [
    // Removed shadow-lg from default lg to ensure consistent sizing with secondary buttons
    // { variant: 'default', size: 'lg', class: 'shadow-lg' },
    // CTA variant uses inline CTA styling
    {
      variant: 'cta',
      class: [
        'bg-primary text-primary-foreground',
        'hover:bg-primary/90 hover:scale-105',
        'active:bg-primary/80 active:scale-95',
        'shadow-md hover:shadow-lg',
        'transition-all duration-200 ease-in-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'h-10 px-4 font-semibold',
      ].join(' ')
    },
  ],
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

export { buttonVariants };


