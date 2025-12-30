// styles/organisms/result-panel.ts
import { tv, type VariantProps } from '@/styles';

const resultPanelVariants = tv({
  base: [
    'relative w-full rounded-lg border bg-background',
    'transition-all duration-200 ease-in-out',
  ],
  variants: {
    status: {
      default: 'bg-background border-border',
      success: 'bg-green-50 border-green-400/30 text-green-700 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300',
      error: 'bg-red-50 border-red-400/30 text-red-700 dark:bg-red-900/20 dark:border-red-600 dark:text-red-300',
    },
  },
  defaultVariants: {
    status: 'default',
  },
});

export type ResultPanelVariantProps = VariantProps<typeof resultPanelVariants>;

export { resultPanelVariants };



