/**
 * Test harness for rendering React components with appropriate providers.
 * Provides render utilities for testing React components in isolation with
 * necessary context providers (Clerk, React Query, Dashboard, etc.)
 */

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import React from 'react';


// Mock Clerk appearance for tests
const mockClerkAppearance = {
  layout: { unsafe_disableDevelopmentModeWarnings: true },
  elements: {
    userButtonPopoverCard: 'shadow-lg',
  },
};

// Create a test QueryClient with default options
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0, // Make queries stale immediately for testing
        cacheTime: 0, // Don't cache in tests
        retry: false, // Don't retry failed queries in tests
      },
      mutations: {
        retry: false, // Don't retry mutations in tests
      },
    },
  });
}

// Default providers for most component tests
function AllProviders({
  children,
  queryClient
}: {
  children: React.ReactNode;
  queryClient?: QueryClient;
}) {
  const [client] = React.useState(() => queryClient || createTestQueryClient());

  return (
    <ClerkProvider appearance={mockClerkAppearance}>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// Providers without Dashboard context (for non-dashboard components)
function BasicProviders({
  children,
  queryClient
}: {
  children: React.ReactNode;
  queryClient?: QueryClient;
}) {
  const [client] = React.useState(() => queryClient || createTestQueryClient());

  return (
    <ClerkProvider appearance={mockClerkAppearance}>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </ClerkProvider>
  );
}

// Only QueryClient provider (for components that don't need auth)
function QueryOnlyProviders({
  children,
  queryClient
}: {
  children: React.ReactNode;
  queryClient?: QueryClient;
}) {
  const [client] = React.useState(() => queryClient || createTestQueryClient());

  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Render component with all providers (Clerk, React Query)
 * Use this for components that need full context
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient;
  } = {}
) {
  const { queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders queryClient={queryClient}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Render component with basic providers (Clerk, React Query)
 * Use this for non-dashboard components that need authentication context
 */
export function renderWithAuth(
  ui: React.ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient;
  } = {}
) {
  const { queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <BasicProviders queryClient={queryClient}>
        {children}
      </BasicProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Render component with only React Query provider
 * Use this for components that don't need authentication or dashboard context
 */
export function renderWithQueryClient(
  ui: React.ReactElement,
  options: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient;
  } = {}
) {
  const { queryClient, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryOnlyProviders queryClient={queryClient}>
        {children}
      </QueryOnlyProviders>
    ),
    ...renderOptions,
  });
}

/**
 * Render component without any providers
 * Use this for pure UI components that don't need any context
 */
export function renderWithoutProviders(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  return render(ui, options);
}

// Re-export render from testing-library for convenience
export { render } from '@testing-library/react';
