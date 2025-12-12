import { containerWithPaddingVariants } from "@/styles/ui/shared/container-helpers";
import type { VariantProps } from '@/styles/utils';
import { tv } from '@/styles/utils';
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


