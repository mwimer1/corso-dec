// tests/lib/clickhouse-concurrency.test.ts
// Tests for Promise-based semaphore (Turbopack-compatible)

import { describe, expect, it } from 'vitest';
import { createSemaphore } from '@/lib/integrations/clickhouse/concurrency';

describe('createSemaphore (ClickHouse concurrency)', () => {
  it('limits concurrency to specified number', async () => {
    const semaphore = createSemaphore(2);
    let active = 0;
    let maxConcurrent = 0;

    const tasks = Array.from({ length: 5 }, (_, i) =>
      semaphore(async () => {
        active++;
        maxConcurrent = Math.max(maxConcurrent, active);
        await new Promise((resolve) => setTimeout(resolve, 10));
        active--;
        return i;
      })
    );

    await Promise.all(tasks);
    expect(maxConcurrent).toBeLessThanOrEqual(2);
    expect(active).toBe(0);
  });

  it('processes all tasks eventually', async () => {
    const semaphore = createSemaphore(2);
    const results: number[] = [];

    const tasks = Array.from({ length: 10 }, (_, i) =>
      semaphore(async () => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        results.push(i);
        return i;
      })
    );

    await Promise.all(tasks);
    expect(results.length).toBe(10);
    expect(results.sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('handles errors without blocking other tasks', async () => {
    const semaphore = createSemaphore(2);
    const results: number[] = [];

    const tasks = [
      semaphore(async () => {
        results.push(0);
        return 0;
      }),
      semaphore(async () => {
        throw new Error('Task failed');
      }),
      semaphore(async () => {
        results.push(2);
        return 2;
      }),
    ];

    await expect(Promise.all(tasks)).rejects.toThrow('Task failed');
    expect(results).toContain(0);
    expect(results).toContain(2);
  });

  it('throws error for invalid concurrency', () => {
    expect(() => createSemaphore(0)).toThrow('Concurrency limit must be at least 1');
    expect(() => createSemaphore(-1)).toThrow('Concurrency limit must be at least 1');
  });

  it('works with synchronous functions', async () => {
    const semaphore = createSemaphore(1);
    const result = await semaphore(() => 42);
    expect(result).toBe(42);
  });
});
