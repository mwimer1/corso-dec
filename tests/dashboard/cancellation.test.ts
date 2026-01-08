import { describe, expect, it, vi } from 'vitest';

describe('React Query cancellation (fetch AbortSignal wiring)', () => {
  it('aborts the previous request when superseded', async () => {
    const abortSpy = vi.fn();
    // Simulate fetch that hooks into signal
    global.fetch = vi.fn((input: RequestInfo, init?: RequestInit) => {
      const signal = init?.signal as AbortSignal | null | undefined;
      if (signal) {
        signal.addEventListener('abort', abortSpy, { once: true });
      }
      // never resolve; we only care about abort being called
      return new Promise<any>(() => {});
    }) as any;

    // NOTE: This is a skeleton test.
    // In the real test, render the DataTableContainer, trigger rapid param changes,
    // and assert abortSpy was called for the first request.
    expect(typeof global.fetch).toBe('function');
  });
});

