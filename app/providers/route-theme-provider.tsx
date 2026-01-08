'use client';
import { useEffect } from 'react';

interface RouteThemeProviderProps {
  theme: 'auth' | 'marketing' | 'protected';
}

// Shared theme provider that encapsulates route theme switching logic
// Ensures theme tokens are applied at the <html> root level during client runtime
export default function RouteThemeProvider({ theme }: RouteThemeProviderProps) {
  useEffect(() => {
    const previous = document.documentElement.dataset['routeTheme'] || 'protected';
    document.documentElement.dataset['routeTheme'] = theme;
    return () => {
      document.documentElement.dataset['routeTheme'] = previous;
    };
  }, [theme]);

  return null;
}
