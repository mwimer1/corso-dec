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

/**
 * Helper to handle both function and string returns from tv() slots.
 * Defensive fix for test environment where slots may return strings directly.
 * 
 * @param x - A value that may be a function returning a string, or a string/undefined
 * @returns The string value, or undefined if the input is undefined
 * 
 * @example
 * ```tsx
 * const styles = navbarStyleVariants();
 * const className = cls(styles.navbar); // Handles both function and string returns
 * ```
 */
export function cls(x: unknown): string | undefined {
  return typeof x === 'function' ? (x as () => string)() : (x as string | undefined);
}


