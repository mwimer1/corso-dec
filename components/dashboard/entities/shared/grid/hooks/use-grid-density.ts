"use client";

import { useCallback, useState } from 'react';

type DensityMode = 'comfortable' | 'compact';

interface UseGridDensityOptions {
  /** Grid ID (required for storage key) */
  gridId: string;
  /** Optional user ID to include in storage key (for per-user density) */
  userId?: string;
  /** Initial density (defaults to 'comfortable') */
  initialDensity?: DensityMode;
  /** Optional callback when density changes */
  onDensityChange?: (density: DensityMode) => void;
}

/**
 * Hook for managing grid density with localStorage persistence.
 * Handles SSR safety and localStorage errors gracefully.
 */
export function useGridDensity({
  gridId,
  userId,
  initialDensity = 'comfortable',
  onDensityChange,
}: UseGridDensityOptions) {
  const storageKey = userId
    ? `corso:gridDensity:${userId}:${gridId}`
    : `corso:gridDensity:${gridId}`;

  const [density, setDensity] = useState<DensityMode>(() => {
    if (typeof window === 'undefined') return initialDensity;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'comfortable' || stored === 'compact') {
        return stored as DensityMode;
      }
    } catch {
      // Ignore localStorage errors
    }
    return initialDensity;
  });

  const handleDensityChange = useCallback(
    (newDensity: DensityMode) => {
      setDensity(newDensity);
      try {
        localStorage.setItem(storageKey, newDensity);
      } catch {
        // Ignore localStorage errors
      }
      onDensityChange?.(newDensity);
    },
    [storageKey, onDensityChange]
  );

  return {
    density,
    setDensity: handleDensityChange,
  };
}














