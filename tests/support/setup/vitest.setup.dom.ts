// DOM-specific test setup - browser and React component mocks

import "@testing-library/jest-dom/vitest";
import { expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';
import React from 'react';
import { vi } from 'vitest';

expect.extend(matchers);

// Solid Clerk mocks (prevent undefined elements in SidebarUserProfile)
vi.mock('@clerk/nextjs', async () => {
  const React = await import('react');
  return {
    SignedIn: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    SignedOut: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    UserButton: (props: any) => React.createElement('div', { 'data-testid': 'user-button', ...props }),
    useUser: () => ({ isSignedIn: true, user: { fullName: 'Test User', id: 'u_123' } }),
    useOrganization: () => ({ 
      organization: { id: 'org_test_123', name: 'Test Org' }, 
      isLoaded: true 
    }),
    useAuth: () => ({
      userId: 'test-user',
      signOut: vi.fn(),
      getToken: vi.fn(),
    }),
    auth: vi.fn(),
    currentUser: vi.fn(),
    ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock CSS modules
vi.mock('*.module.css', () => ({}));

// Mock @/molecules for component tests
vi.mock('@/molecules', () => ({
  LinkTrack: ({ children, ..._props }: any) => children,
  EmptyStateActions: ({ children, ..._props }: any) => children,
  EmptyStateDescription: ({ children, ..._props }: any) => children,
  EmptyStateIcon: ({ children, ..._props }: any) => children,
  EmptyStateTitle: ({ children, ..._props }: any) => children,
  DataTablePagination: ({ children, ..._props }: any) => children,
  DataTableToolbar: ({ children, ..._props }: any) => children,
  DataTableViewOptions: ({ children, ..._props }: any) => children,
  PaginationButton: ({ children, ..._props }: any) => children,
  TableHeadBase: ({ children, ..._props }: any) => children,
  SectionHeader: ({ children, ..._props }: any) => children,
}));

// Mock @/ui/molecules for component tests
vi.mock('@/ui/molecules', () => ({
  EmptyStateActions: ({ children, ..._props }: any) => children,
  EmptyStateDescription: ({ children, ..._props }: any) => children,
  EmptyStateIcon: ({ children, ..._props }: any) => children,
  EmptyStateTitle: ({ children, ..._props }: any) => children,
  DataTablePagination: ({ children, ..._props }: any) => children,
  DataTableToolbar: ({ children, ..._props }: any) => children,
  DataTableViewOptions: ({ children, ..._props }: any) => children,
  PaginationButton: ({ children, ..._props }: any) => children,
  TableHeadBase: ({ children, ..._props }: any) => children,
  SectionHeader: ({ children, ..._props }: any) => children,
}));

// Mock next/dynamic to return components directly in tests (no lazy loading)
// This allows dynamically imported components to render immediately in tests
const dynamicComponentCache = new Map<string, any>();
// Track pending loads to prevent duplicate requests
const pendingLoads = new Map<string, Promise<any>>();

vi.mock('next/dynamic', async () => {
  const React = await import('react');
  return {
    default: (importFn: () => Promise<any>, options?: any) => {
      // Create a cache key from the function string representation
      const cacheKey = importFn.toString();
      
      // For tests, return a component that immediately starts loading
      // and renders once the import resolves, with caching for performance
      return function DynamicComponent(componentProps: any) {
        // Ensure props is always an object to prevent destructuring errors
        const props = componentProps || {};
        const loadingStartedRef = React.useRef(false);
        
        // Try to get from cache immediately (synchronous)
        const [Component, setComponent] = React.useState<any>(() => {
          const cached = dynamicComponentCache.get(cacheKey);
          return cached && typeof cached === 'function' ? cached : null;
        });
        const [isLoading, setIsLoading] = React.useState(!Component);
        
        // Use useLayoutEffect for synchronous execution before paint
        // This ensures components load as quickly as possible in tests
        React.useLayoutEffect(() => {
          // If component is already loaded, no need to do anything
          if (Component) {
            return;
          }
          
          // If already cached, use it immediately
          if (dynamicComponentCache.has(cacheKey)) {
            const cached = dynamicComponentCache.get(cacheKey);
            if (cached && typeof cached === 'function') {
              setComponent(() => cached);
              setIsLoading(false);
            }
            return;
          }
          
          // Prevent duplicate loads
          if (loadingStartedRef.current) {
            return;
          }
          loadingStartedRef.current = true;
          
          // Check if there's already a pending load for this component
          let loadPromise = pendingLoads.get(cacheKey);
          if (!loadPromise) {
            // Start loading the component
            loadPromise = (async () => {
              try {
                const mod = await importFn();
                // Handle both default exports and named exports
                const resolved = mod.default || mod;
                // Ensure we have a valid React component (must be a function)
                if (typeof resolved === 'function') {
                  dynamicComponentCache.set(cacheKey, resolved);
                  return resolved;
                } else {
                  console.warn('Dynamic import resolved to non-component:', resolved, 'Module:', mod);
                  return null;
                }
              } catch (err) {
                console.error('Dynamic import failed:', err);
                return null;
              } finally {
                // Clean up pending load
                pendingLoads.delete(cacheKey);
              }
            })();
            pendingLoads.set(cacheKey, loadPromise);
          }
          
          // Wait for the load to complete and update state
          void loadPromise.then((resolved) => {
            if (resolved && typeof resolved === 'function') {
              setComponent(() => resolved);
              setIsLoading(false);
            } else {
              setIsLoading(false);
            }
          });
        }, [cacheKey]); // Only depend on cacheKey, not Component
        
        // Only render if Component is a valid function
        if (Component && typeof Component === 'function') {
          return React.createElement(Component, props);
        }
        
        // Return loading state if provided, otherwise null
        if (isLoading && options?.loading) {
          return React.createElement(options.loading);
        }
        return null;
      };
    },
  };
});

// Note: @/atoms is now mocked at the vitest configuration level

// Mock validation import for tests that need it
vi.mock('@/lib/actions/validation', () => ({
  validateInput: (schema: any, body: any, label?: string) => {
    // Minimal behavior: ensure body has sql string, otherwise throw as validation would
    const parsed = body ?? undefined;
    if (!parsed || typeof parsed.sql !== 'string') {
      throw new Error(`${label ?? 'input'} validation failed`);
    }
    return { sql: parsed.sql, limit: parsed.limit };
  },
}));

// Provide TextEncoder/Decoder for browser tests
// Use browser-compatible approach instead of node:util to avoid Vite externalization warning
// jsdom should provide these natively, but we ensure they're available for compatibility
if (typeof globalThis.TextEncoder === 'undefined') {
  // Use Node.js TextEncoder/Decoder if available (for Node.js test environments)
  // Otherwise, jsdom should provide them natively in browser environment
  try {
    // Try to use Node.js built-in (works in Node.js test environment)
    const { TextEncoder: NodeTextEncoder, TextDecoder: NodeTextDecoder } = await import('util');
    // @ts-expect-error - Assigning Node.js polyfill for compatibility
    globalThis.TextEncoder = NodeTextEncoder;
    // @ts-expect-error - Assigning Node.js polyfill for compatibility
    globalThis.TextDecoder = NodeTextDecoder;
  } catch {
    // Fallback: jsdom should provide these natively, but provide minimal polyfill if needed
    // @ts-expect-error - Minimal polyfill for browser compatibility
    globalThis.TextEncoder = class TextEncoder {
      encode(str: string): Uint8Array {
        if (typeof Buffer !== 'undefined') {
          return new Uint8Array(Buffer.from(str, 'utf-8'));
        }
        // Minimal UTF-8 encoding (for environments without Buffer)
        const utf8: number[] = [];
        for (let i = 0; i < str.length; i++) {
          const charCode = str.charCodeAt(i);
          if (charCode < 0x80) {
            utf8.push(charCode);
          } else if (charCode < 0x800) {
            utf8.push(0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f));
          } else {
            utf8.push(0xe0 | (charCode >> 12), 0x80 | ((charCode >> 6) & 0x3f), 0x80 | (charCode & 0x3f));
          }
        }
        return new Uint8Array(utf8);
      }
    };
    // @ts-expect-error - Minimal polyfill for browser compatibility
    globalThis.TextDecoder = class TextDecoder {
      decode(bytes: Uint8Array): string {
        if (typeof Buffer !== 'undefined') {
          return Buffer.from(bytes).toString('utf-8');
        }
        // Minimal UTF-8 decoding (for environments without Buffer)
        let result = '';
        let i = 0;
        while (i < bytes.length) {
          const byte1 = bytes[i++];
          if (byte1 < 0x80) {
            result += String.fromCharCode(byte1);
          } else if ((byte1 >> 5) === 0x06) {
            const byte2 = bytes[i++];
            result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
          } else {
            const byte2 = bytes[i++];
            const byte3 = bytes[i++];
            result += String.fromCharCode(((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f));
          }
        }
        return result;
      }
    };
  }
}
(globalThis as any).React = React;

// matchMedia polyfill
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({ matches: false, media: query, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false }),
  });
}

// Ensure user-event clipboard helpers don't crash under jsdom
Object.assign(window.navigator, {
  clipboard: {
    writeText: vi.fn(async () => undefined),
    readText: vi.fn(async () => '')
  }
});

// Optional: silence ResizeObserver in JSDOM if table virtualizer uses it
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = (globalThis as any).ResizeObserver || RO;



