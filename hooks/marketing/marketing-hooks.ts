'use client';

// hooks/marketing/index.ts – Production-ready implementations for marketing-related hooks.

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * useABTest – Determine which variant ('A' or 'B') of an A/B test the user should see, with consistent assignment per user/device.
 */
export function useABTest(testId: string): 'A' | 'B' {
  const [variant, setVariant] = useState<'A' | 'B'>(() => {
    if (typeof window === 'undefined') {
      return 'A'; // Default variant during SSR or no window
    }
    const storageKey = `abtest:${testId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored === 'A' || stored === 'B') {
      return stored;
    }
    // Assign a random variant and persist it
    const newVariant = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(storageKey, newVariant);
    return newVariant;
  });

  // If the testId changes, recalculate and persist the variant
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storageKey = `abtest:${testId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored === 'A' || stored === 'B') {
      setVariant(stored);
    } else {
      const newVariant = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem(storageKey, newVariant);
      setVariant(newVariant);
    }
  }, [testId]);

  return variant;
}

/**
 * useCampaignData – Extract UTM and other campaign parameters from the current page URL, updating on route changes.
 */
export function useCampaignData(): Record<string, string> {
  const [data, setData] = useState<Record<string, string>>({});
  const searchParams = useSearchParams();  // Next.js App Router hook for query params

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = searchParams ?? new URLSearchParams(window.location.search);
    const campaign: Record<string, string> = {};
    params.forEach((value, key) => {
      if (key.startsWith('utm_')) {
        campaign[key] = value;
      }
      // Include other marketing params if needed (e.g., 'ref', 'campaign')
    });
    setData(campaign);
  }, [searchParams]);

  return data;
}

/**
 * useAnalyticsTracking – Send a tracking event to analytics on component mount.
 * Uses shared tracking utilities for consistency and consent checking.
 */
export function useAnalyticsTracking(event: string, payload: Record<string, unknown> = {}): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Import and use shared tracking utilities for consistency
    import('@/lib/shared/analytics/track').then(({ trackEvent }) => {
      trackEvent(event, payload);
    });
  }, [event, payload]);
}

