// DOM-specific test setup - browser and React component mocks

import "@testing-library/jest-dom/vitest";
import React from 'react';
import { vi } from 'vitest';

// Solid Clerk mocks (prevent undefined elements in SidebarUserProfile)
vi.mock('@clerk/nextjs', async () => {
  const React = await import('react');
  return {
    SignedIn: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    SignedOut: ({ children }: { children?: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    UserButton: (props: any) => React.createElement('div', { 'data-testid': 'user-button', ...props }),
    useUser: () => ({ isSignedIn: true, user: { fullName: 'Test User', id: 'u_123' } }),
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
  TabSwitcher: ({ children, ..._props }: any) => children,
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
vi.mock('next/dynamic', async () => {
  const React = await import('react');
  return {
    default: (importFn: () => Promise<any>, options?: any) => {
      // For tests, return a component that immediately starts loading
      // and renders once the import resolves
      return function DynamicComponent(props: any) {
        const [Component, setComponent] = React.useState<any>(null);
        const [isLoading, setIsLoading] = React.useState(true);
        
        React.useEffect(() => {
          let cancelled = false;
          importFn()
            .then((mod) => {
              if (!cancelled) {
                setComponent(() => mod.default || mod);
                setIsLoading(false);
              }
            })
            .catch(() => {
              if (!cancelled) {
                setIsLoading(false);
              }
            });
          
          return () => {
            cancelled = true;
          };
        }, []);
        
        if (Component) {
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
import { TextDecoder, TextEncoder } from 'node:util';
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;
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



