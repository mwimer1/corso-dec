// styles/components/ui/atoms/toggle.ts
import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

/**
 * toggleVariants
 * --------------
 * Radix `@radix-ui/react-toggle` recipe.
 * Keeps visual parity with Button but adds pressed/on state styling.
 *
 * ## Example
 * ```tsx
 * <Toggle intent="primary" size="sm" pressed={isBold} aria-label="Toggle bold">
 *   <BoldIcon />
 * </Toggle>
 * ```
 */
const toggleVariants = tv({
  base: [
    'relative inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm max-lg:text-base font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'data-[state=on]:bg-surface-selected data-[state=on]:text-[hsl(var(--text-high))]',
  ],
  variants: {
    variant: {
      default:
        'bg-surface hover:bg-surface-hover text-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
      secondary:
        'bg-surface hover:bg-surface-hover text-foreground data-[state=on]:bg-secondary data-[state=on]:text-secondary-foreground',
      destructive:
        'bg-surface hover:bg-surface-hover text-destructive data-[state=on]:bg-destructive data-[state=on]:text-destructive-foreground',
      ghost:
        'bg-transparent hover:bg-surface-hover text-foreground data-[state=on]:bg-surface-selected',
      outline:
        'border border-border bg-transparent hover:bg-surface-hover text-foreground data-[state=on]:bg-surface-selected',
    },
    size: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-8 px-3 text-sm',
      lg: 'h-10.5 px-3.5 text-base',
    },
  },
  compoundVariants: [
    {
      variant: 'ghost',
      class: 'data-[state=on]:text-[hsl(var(--primary))]',
    },
  ],
  defaultVariants: { variant: 'default' },
});

export type ToggleVariantProps = VariantProps<typeof toggleVariants>;

export { toggleVariants };


