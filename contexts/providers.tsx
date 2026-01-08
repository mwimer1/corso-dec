// contexts/providers.tsx
// Description: App-wide context providers (React Query, Clerk, theme, etc.) for the root layout.
'use client';

import { ClerkScriptLoader } from '@/components/auth/internal';
import { clerkAppearanceLight, type ClerkAppearance } from '@/lib/auth/client';
import { publicEnv } from '@/lib/shared';
import { ClerkProvider } from '@clerk/nextjs';
import { isDevelopment } from './shared/is-development';
// Remove runtime theme probing; rely on token-driven variables/elements for a light appearance.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import React from 'react';

// Devtools wrapper component to avoid IIFE initialization issues
const DevtoolsWrapper = dynamic(
  () => import('@tanstack/react-query-devtools').then((m) => ({ default: m.ReactQueryDevtools })),
  { ssr: false }
);

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60_000,
            cacheTime: 15 * 60_000, // cache retained 15 minutes
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            retry: (failureCount: number, error: unknown) =>
              failureCount < 3 &&
              !(error as { status?: number })?.status?.toString().startsWith('4'),
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  const hideDevRibbon = publicEnv.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL === 'true' || publicEnv.NEXT_PUBLIC_CLERK_SIGN_IN_URL === 'true' || (publicEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === undefined ? false : false);
  const appearance: ClerkAppearance = hideDevRibbon
    ? { ...clerkAppearanceLight, layout: { unsafe_disableDevelopmentModeWarnings: true } }
    : clerkAppearanceLight;

  return (
    <ClerkScriptLoader>
      {/* Clerk v6: avoid forcing global dynamic rendering; prefer request-time auth */}
      <ClerkProvider appearance={appearance}>
        <QueryClientProvider client={queryClient}>
          {children}
          {
            // Load Devtools only in development and only on the client, completely
            // excluding the package from production bundles.
            isDevelopment() && <DevtoolsWrapper />
          }
        </QueryClientProvider>
      </ClerkProvider>
    </ClerkScriptLoader>
  );
};

export default Providers;
