import { tv, type VariantProps } from '@/styles';
import { focusRing } from '@/styles/ui/shared/focus-ring';

/**
 * Variants for industry tab buttons in the use-case-explorer section.
 * Intentionally local to use-cases (separate from product-showcase TabSwitcher).
 * 
 * Note: Preview container, skeleton, and image variants have been moved to
 * use-case-explorer.module.css for better control over transitions and responsive behavior.
 */
const industryTabButtonVariants = tv({
  base: [
    'inline-flex items-center gap-2 px-lg py-xs rounded-[var(--radius-button)]',
    'text-sm font-medium tracking-wide transition-colors border-solid',
    focusRing('primary'),
  ],
  variants: {
    isActive: {
      true: 'border border-foreground bg-muted text-foreground font-semibold',
      false: 'border border-border bg-background text-foreground hover:bg-muted/60',
    },
  },
  defaultVariants: {
    isActive: false,
  },
});

export type IndustryTabButtonVariantProps = VariantProps<typeof industryTabButtonVariants>;

export { industryTabButtonVariants };
