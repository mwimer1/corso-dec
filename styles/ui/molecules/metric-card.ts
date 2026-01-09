import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

/**
 * metricCardVariants
 * -------------------
 * Variant recipe for the `<MetricCard>` molecule.
 * Supports tone variants (neutral, brand, success), sizes, density, and value text sizing.
 */
const metricCardVariants = tv({
  base: [
    'rounded-2xl border bg-card shadow-sm',
    'flex flex-col items-center justify-center',
  ],
  variants: {
    tone: {
      neutral: 'border-border bg-muted/30',
      brand: 'border-ring bg-surface-selected/15',
      success: 'border-success bg-success/8',
    },
    size: {
      md: 'min-h-[168px]',
      lg: 'min-h-[200px]',
    },
    density: {
      normal: 'p-5 md:p-6 gap-2',
      compact: 'p-4 md:p-4 gap-1.5',
    },
    valueSize: {
      md: 'text-3xl md:text-4xl',
      sm: 'text-2xl md:text-3xl',
    },
  },
  defaultVariants: {
    tone: 'neutral',
    size: 'md',
    density: 'normal',
    valueSize: 'md',
  },
});

/**
 * Value size variants for metric card value display.
 * Separate variant factory for nested value element to maintain type safety.
 */
const metricCardValueSizeVariants = tv({
  base: 'font-extrabold leading-none text-center',
  variants: {
    valueSize: {
      md: 'text-3xl md:text-4xl',
      sm: 'text-2xl md:text-3xl',
    },
  },
  defaultVariants: {
    valueSize: 'md',
  },
});

export type MetricCardVariantProps = VariantProps<typeof metricCardVariants>;
export type MetricCardValueSizeVariantProps = VariantProps<typeof metricCardValueSizeVariants>;

export { metricCardVariants, metricCardValueSizeVariants };
