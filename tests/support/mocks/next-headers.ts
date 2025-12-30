import { vi } from 'vitest';

/**
 * Mock implementation of next/headers functions
 */
const mockHeadersFn = vi.fn();
const mockCookiesStore = new Map<string, string>();

// Top-level module mock registration (Vitest best practice)
vi.mock('next/headers', () => ({
  headers: () => mockHeadersFn(),
  cookies: () => ({
    get: (name: string) => (mockCookiesStore.has(name) ? { name, value: mockCookiesStore.get(name)! } : undefined),
    set: (name: string, value: string) => { mockCookiesStore.set(name, value); },
    delete: (name: string) => { mockCookiesStore.delete(name); },
    getAll: () => Array.from(mockCookiesStore.entries()).map(([name, value]) => ({ name, value })),
  }),
  draftMode: () => ({
    isEnabled: false,
    enable: () => {},
    disable: () => {},
  }),
}));

/**
 * Configuration options for next/headers mock
 */
export interface NextHeadersMockOptions {
  /** Headers to return from headers() call */
  headers?: HeadersInit | Record<string, string>;
  /** Optional cookies to initialize */
  cookies?: Record<string, string>;
}

/**
 * Centralized next/headers mock utility
 * 
 * Usage:
 * ```typescript
 * import { mockHeaders } from '@/tests/support/mocks';
 * 
 * beforeEach(() => {
 *   mockHeaders.setup({
 *     headers: { 'cf-connecting-ip': '192.168.1.1' }
 *   });
 * });
 * ```
 */
export const mockHeaders = {
  /**
   * Get the underlying headers mock function for advanced usage
   */
  getMock(): ReturnType<typeof vi.fn> {
    return mockHeadersFn;
  },

  /**
   * Configure the headers mock return value
   * @param options Configuration options
   */
  setup(options: NextHeadersMockOptions = {}): void {
    if (options.headers) {
      mockHeadersFn.mockReturnValue(new Headers(options.headers));
    } else {
      mockHeadersFn.mockReturnValue(new Headers());
    }

    // Initialize cookies if provided
    if (options.cookies) {
      mockCookiesStore.clear();
      for (const [name, value] of Object.entries(options.cookies)) {
        mockCookiesStore.set(name, value);
      }
    }
  },

  /**
   * Reset the mock (clears call history and resets to defaults)
   */
  reset(): void {
    mockHeadersFn.mockClear();
    mockCookiesStore.clear();
    mockHeadersFn.mockReturnValue(new Headers());
  },

  /**
   * Clear mock call history without resetting return value
   */
  clear(): void {
    mockHeadersFn.mockClear();
  },

  /**
   * Get cookies store for manual manipulation
   */
  getCookiesStore(): Map<string, string> {
    return mockCookiesStore;
  },
};

// Legacy exports for backward compatibility (if any code imports these directly)
export function headers(): Headers {
  return mockHeadersFn();
}

export function cookies() {
  return {
    get: (name: string) => (mockCookiesStore.has(name) ? { name, value: mockCookiesStore.get(name)! } : undefined),
    set: (name: string, value: string) => { mockCookiesStore.set(name, value); },
    delete: (name: string) => { mockCookiesStore.delete(name); },
    getAll: () => Array.from(mockCookiesStore.entries()).map(([name, value]) => ({ name, value })),
  };
}

export function draftMode() {
  return {
    isEnabled: false,
    enable: () => {},
    disable: () => {},
  };
}
