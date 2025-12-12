// components/auth/clerk-script-loader.tsx
// Custom script loader for Clerk JavaScript files to fix invalid Cache-Control headers

'use client';

import { useEffect } from 'react';

interface ClerkScriptLoaderProps {
  children: React.ReactNode;
}

export function ClerkScriptLoader({ children }: ClerkScriptLoaderProps) {
  useEffect(() => {
    // Guard SSR and preloaded globals
    if (typeof window === 'undefined') return;
    if ((window as any).Clerk) return;

    // Load Clerk script from our proxy endpoint with proper headers
    const script = document.createElement('script');
    script.src = '/clerk-js/clerk.browser.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    // Add error handling
    script.onerror = () => {
      console.error('Failed to load Clerk script from proxy. Falling back to CDN.');
      // Fallback to official Clerk CDN
      const fallbackScript = document.createElement('script');
      fallbackScript.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
      fallbackScript.async = true;
      fallbackScript.crossOrigin = 'anonymous';
      document.head.appendChild(fallbackScript);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return <>{children}</>;
}
