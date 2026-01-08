"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect user's preference for reduced motion.
 * Returns true if the user has enabled prefers-reduced-motion in their system settings.
 * 
 * @returns boolean - true if user prefers reduced motion, false otherwise
 */
export default function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Use addEventListener if available (modern browsers)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => {
        mediaQuery.removeEventListener('change', handler);
      };
    } else {
      // Fallback for older browsers (Safari < 14, etc.)
      // addListener is deprecated but needed for older browsers
      mediaQuery.addListener(handler);
      return () => {
        // removeListener is deprecated but needed for older browsers
        mediaQuery.removeListener(handler);
      };
    }
  }, []);

  return prefersReducedMotion;
}
