'use client';

// hooks/security/index.ts – Production-ready implementations for security-related hooks.

import { postJSON } from '@/lib/api/client';
import { reportBrowserError } from '@/lib/shared';
import { useCallback } from 'react';

/**
 * useSecurityAudit – Log security events for monitoring and compliance.
 */
export function useSecurityAudit() {
  const log = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    // Always log to console for local debugging
    console.debug('[SecurityAudit]', event, payload);

    // Prepare event data with timestamp
    const eventData = { event, payload, timestamp: new Date().toISOString() };

    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        // Use sendBeacon for asynchronous, non-blocking logging (e.g., during unload)
        const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
        navigator.sendBeacon('/api/security/audit', blob);
      } else if (typeof fetch !== 'undefined') {
        // Fallback to fetch with keepalive for logging
        postJSON('/api/security/audit', eventData, { keepalive: true }).catch((err) => {
          reportBrowserError(err, 'Security audit network request');
        });
      }
    } catch (err) {
      reportBrowserError(err, 'Security audit logging');
    }
  }, []);

  return { log } as const;
}

