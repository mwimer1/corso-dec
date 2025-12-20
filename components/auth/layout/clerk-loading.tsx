'use client';

import { Spinner } from '@/components/ui/atoms';

/**
 * Styled loading component for Clerk authentication forms.
 * Matches the auth page card styling to prevent layout shift during Clerk SDK loading.
 */
export function ClerkLoading() {
  return (
    <div className="bg-surface text-foreground border border-border shadow-[var(--shadow-card)] rounded-xl p-8">
      <div className="flex flex-col items-center justify-center space-y-4 min-h-[200px]">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading authentication...</p>
      </div>
    </div>
  );
}

