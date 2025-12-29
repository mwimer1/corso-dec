// lib/server/utils/timeout.ts
// Sprint 2: Timeout utilities for SQL query execution
import 'server-only';

/**
 * Wraps a promise with a timeout. If the timeout expires, the promise is rejected.
 * 
 * @param promise The promise to wrap
 * @param ms Timeout in milliseconds
 * @param signal Optional AbortSignal for cancellation
 * @returns The original promise result, or rejects if timeout expires
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  signal?: AbortSignal,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    // If signal is already aborted, reject immediately
    if (signal?.aborted) {
      reject(new Error('Operation aborted'));
      return;
    }
    
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
    
    // Clear timeout when promise resolves/rejects
    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    
    // Clear timeout if signal is aborted
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Operation aborted'));
      }, { once: true });
    }
  });
}

