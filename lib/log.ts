/**
 * Development-only logging utilities.
 * 
 * These functions only log in development mode (NODE_ENV !== 'production').
 * In production, they are no-ops to avoid polluting console output.
 */

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Log an error message in development mode only.
 * @param args - Arguments to pass to console.error
 */
export function devError(...args: unknown[]): void {
  if (isDev) {
    console.error(...args);
  }
}

/**
 * Log a warning message in development mode only.
 * @param args - Arguments to pass to console.warn
 */
export function devWarn(...args: unknown[]): void {
  if (isDev) {
    console.warn(...args);
  }
}
