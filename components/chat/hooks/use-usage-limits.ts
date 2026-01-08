// components/chat/hooks/use-usage-limits.ts
// Shared hook for Deep Research usage limits fetching

"use client";

import { useEffect, useState } from 'react';
import { publicEnv } from '@/lib/shared/config/client';

export interface UsageLimits {
  remaining: number;
  limit: number;
  currentUsage: number;
}

/**
 * Hook to fetch Deep Research usage limits.
 * Provides graceful degradation - if fetch fails, limits are unavailable but chat can proceed.
 * 
 * @param enabled - Whether to fetch limits (typically when deepResearch is enabled)
 * @returns Usage limits or null if unavailable/fetch failed
 */
export function useUsageLimits(enabled: boolean): UsageLimits | null {
  const [limits, setLimits] = useState<UsageLimits | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLimits(null);
      return;
    }

    const fetchLimits = async () => {
      try {
        const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/v1/ai/chat/usage-limits`, {
          credentials: 'include',
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setLimits(data.data);
          }
        } else {
          // Non-200 response: log but don't block chat
          console.warn('[useUsageLimits] Failed to fetch limits:', res.status);
        }
      } catch (err) {
        // Fetch failed: log but don't block chat (graceful degradation)
        console.warn('[useUsageLimits] Failed to fetch usage limits:', err);
        setLimits(null);
      }
    };

    void fetchLimits();
  }, [enabled]);

  return limits;
}
