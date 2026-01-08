import { tv, type VariantProps } from '@/styles';
import { containerMaxWidthVariants, focusRing } from '@/styles/ui/shared';
const tabSwitcherVariants = tv({
  base: 'mx-auto',
  variants: {
    variant: {
      default: '',
      contained: 'rounded-lg border border-border bg-surface p-lg shadow-sm',
      minimal: 'border-none bg-transparent',
    },
    size: {
      sm: containerMaxWidthVariants({ maxWidth: '2xl' }),
      md: containerMaxWidthVariants({ maxWidth: '4xl' }),
      lg: containerMaxWidthVariants({ maxWidth: '5xl' }),
      xl: containerMaxWidthVariants({ maxWidth: '6xl' }),
    },
    alignment: {
      left: 'mr-auto ml-0',
      center: 'mx-auto',
      right: 'ml-auto mr-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'lg',
    alignment: 'center',
  },
});

/**
 * Variants for individual tab buttons within the tab switcher.
 */
const tabButtonVariants = tv({
  // Pill buttons with token-based borders and clear active state
  base: [
    'px-lg py-xs rounded-button font-medium tracking-wide transition-colors',
    'border-solid',
    focusRing('primary'),
  ],
  variants: {
    isActive: {
      true: 'border border-foreground bg-muted text-foreground',
      false: 'border border-border bg-background text-foreground hover:bg-muted/60',
    },
    /**
     * Visual preset for tab buttons.
     * - default: standard pill tabs
     * - showcaseWhite: geometry parity with navbar pills
     */
    preset: {
      default: '',
      // Product Showcase pills: ensure a clearly visible 2px border
      showcaseWhite: 'h-[32px] px-[14px] py-[6px] rounded-button text-[16px] leading-5 shadow-none border-2',
      /**
       * Grid preset: used when TabSwitcher layout="grid". Buttons behave like grid cards
       * rather than inline pills. They stretch to full width and use a rectangular geometry.
       * Focus ring offset uses showcase background to match ProductShowcase section.
       * Height is controlled via CSS module (product-showcase.module.css) for doubled height.
       */
      grid: 'relative w-full text-left rounded-none px-4 py-0 flex items-center justify-center transition-colors shadow-none text-lg xl:text-[14px] xl:leading-5 xl:tracking-[-0.01em] xl:px-3 focus-visible:ring-offset-showcase',
    },
  },
  compoundVariants: [
    // Grid preset overrides: no per-button borders (tablist owns border-y)
    // Backgrounds are handled inline in component for grid layout to match parent container
    {
      preset: 'grid',
      isActive: true,
      // Active: no borders (tablist owns top/bottom borders)
      // Background and font-weight handled inline in component
      class: [
        'border-0',
        'text-foreground',
      ],
    },
    {
      preset: 'grid',
      isActive: false,
      // Inactive: no borders (tablist owns top/bottom borders)
      // Background and font-weight handled inline in component
      class: [
        'border-0',
        'text-foreground',
      ],
    },
  ],
  defaultVariants: {
    isActive: false,
    preset: 'default',
  },
});

export type TabSwitcherVariantProps = VariantProps<typeof tabSwitcherVariants>;

export { tabButtonVariants, tabSwitcherVariants };
