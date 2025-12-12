// styles/utils.ts
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { tv } from 'tailwind-variants';

// Re-export VariantProps from tailwind-variants for strict typing
export type { VariantProps } from 'tailwind-variants';

/** Merge & de-dupe Tailwind class strings (`cn('p-2', condition && 'p-4')`) */
export function cn(...inputs: Array<string | false | null | undefined>) {
  return twMerge(clsx(inputs));
}

/** Tailwind Variants factory – re-export for convenience */
export { tv };


