import { tv, type VariantProps } from '@/styles';
import { containerMaxWidthVariants } from '@/styles/ui/shared/container-base';
import { focusRing } from "../shared/focus-ring";

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
    'px-lg py-xs rounded-[10px] font-medium tracking-wide transition-colors',
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
      showcaseWhite: 'h-[32px] px-[14px] py-[6px] rounded-[10px] text-[16px] leading-5 shadow-none border-2',
      /**
       * Grid preset: used when TabSwitcher layout="grid". Buttons behave like grid cards
       * rather than inline pills. They stretch to full width and use a rectangular geometry.
       */
      grid: 'relative w-full text-left rounded-none px-4 py-0 h-16 flex items-center justify-center transition-colors shadow-none text-lg',
    },
  },
  compoundVariants: [
    // Grid preset overrides: use only bottom border and square geometry
    {
      preset: 'grid',
      isActive: true,
      // Active: use baseline border color so it visually matches the tablist divider
      // and lift it above the divider to avoid visual darkening from stacking.
      // Includes animated underline rail (3px) that scales from left to right.
      class: [
        'border-0 border-b border-border',
        'bg-muted/30 text-foreground font-semibold',
        'relative z-10',
        // Underline rail: 3px animated bar at bottom
        'after:content-[""] after:absolute after:inset-x-0 after:bottom-0 after:h-[3px]',
        'after:bg-foreground after:origin-left after:scale-x-100',
        'after:transition-transform after:duration-200',
        'motion-reduce:after:transition-none',
      ],
    },
    {
      preset: 'grid',
      isActive: false,
      // Inactive: visible text and border; hover darkens text only (no bg change)
      // Underline rail exists but scaled to 0 (hidden) until active
      class: [
        'border-0 border-b border-foreground/30',
        'bg-transparent text-foreground',
        'hover:text-foreground hover:bg-muted/20',
        'font-normal hover:font-medium',
        // Underline rail: hidden (scale-x-0) until active
        'after:content-[""] after:absolute after:inset-x-0 after:bottom-0 after:h-[3px]',
        'after:bg-foreground after:origin-left after:scale-x-0',
        'after:transition-transform after:duration-200',
        'motion-reduce:after:transition-none',
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




