import { containerWithPaddingVariants } from "@/styles/ui/shared/container-helpers";
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';
/**
 * FullWidthSection variant factory – for full-width layout sections.
 * Supports different backgrounds, padding, and container options.
 */
const fullWidthSectionVariants = tv({
  base: 'relative w-full',
  variants: {
    background: {
      default: 'bg-background',
      alt: 'bg-muted',
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      muted: 'bg-muted',
      transparent: 'bg-transparent',
    },
    padding: {
      none: '',
      sm: 'py-8',
      md: 'py-12',
      lg: 'py-16',
      xl: 'py-20',
      '2xl': 'py-24',
      // Responsive section spacing
      'section-sm': 'pt-8 pb-8 sm:pt-12 sm:pb-12',
      'section-md': 'pt-12 pb-12 sm:pt-16 sm:pb-16',
      'section-lg': 'pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24',
      // Hero-specific: tighter on mobile, spacious on desktop
      'hero': 'pt-[clamp(2rem,4vh,3rem)] pb-[clamp(1.5rem,3vh,2.5rem)] sm:pt-[clamp(3rem,6vh,4rem)] sm:pb-[clamp(2rem,4vh,3rem)]',
    },
    overflow: {
      visible: 'overflow-visible',
      hidden: 'overflow-hidden',
      auto: 'overflow-auto',
    },
    variant: {
      default: 'bg-background text-foreground',
      inverse: 'bg-foreground text-background',
      secondary: 'bg-secondary',
      subtle: 'bg-muted',
    },
    border: {
      none: '',
      sm: 'border-2 border-border',
      md: 'border-4 border-border',
      lg: 'border-6 border-border',
      xl: 'border-8 border-border',
    },
  },
  defaultVariants: {
    background: 'default',
    padding: 'md',
    overflow: 'visible',
  },
});

/**
 * FullWidthSection container variants
 * 
 * @description Uses shared containerMaxWidthVariants for consistent max-width patterns
 */
const fullWidthSectionContainerVariants = containerWithPaddingVariants;

/**
 * FullWidthSection guidelines variants
 *
 * The guidelines are an absolute overlay rendered BEHIND section content
 * and are intended for layout QA only. The component now renders
 * two vertical rails aligned to the inner container gutters (matching
 * the navbar/footer container), rather than a 12‑column grid.
 */
const fullWidthSectionGuidelinesVariants = tv({
  base: 'pointer-events-none absolute inset-0 z-40',
  variants: {
    visibility: {
      hidden: 'hidden',
      desktop: 'hidden lg:block',
      always: 'block',
      min950: 'hidden min-[950px]:block',
    },
    opacity: {
      none: '',
      light: 'opacity-30',
      medium: 'opacity-60',
      heavy: 'opacity-90',
    },
  },
  defaultVariants: {
    visibility: 'always',
    opacity: 'medium',
  },
});

// removed: fullWidthSectionGridVariants (unused)
export type FullWidthSectionVariantProps = VariantProps<typeof fullWidthSectionVariants>;
export type FullWidthSectionContainerVariantProps = VariantProps<
  typeof fullWidthSectionContainerVariants
>;
export type FullWidthSectionGuidelinesVariantProps = VariantProps<
  typeof fullWidthSectionGuidelinesVariants
>;
export {
  fullWidthSectionContainerVariants, fullWidthSectionGuidelinesVariants, fullWidthSectionVariants
};


