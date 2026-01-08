// lib/integrations/clickhouse/concurrency.ts
// Simple Promise-based semaphore for concurrency limiting (Turbopack-compatible)

/**
 * Simple semaphore implementation using Promise queue (Turbopack-compatible).
 * Replaces p-limit which uses Node.js async_hooks that Turbopack cannot resolve.
 * 
 * @param concurrency - Maximum number of concurrent operations
 * @returns Function that limits concurrency of async operations
 */
export function createSemaphore(concurrency: number): <T>(fn: () => Promise<T> | T) => Promise<T> {
  if (concurrency < 1) {
    throw new Error('Concurrency limit must be at least 1');
  }

  let active = 0;
  const queue: Array<() => void> = [];

  const execute = async <T>(fn: () => Promise<T> | T): Promise<T> => {
    // Wait if we're at the concurrency limit
    if (active >= concurrency) {
      await new Promise<void>((resolve) => {
        queue.push(resolve);
      });
    }

    active++;
    try {
      const result = await fn();
      return result;
    } finally {
      active--;
      // Release next queued operation if any
      const next = queue.shift();
      if (next) {
        next();
      }
    }
  };

  return execute;
}
