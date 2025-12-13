'use client';

import { ErrorFallback } from "@/components/ui/organisms";
import { clientLogger } from "@/lib/core";
import { ErrorCategory, ErrorSeverity } from "@/lib/shared/errors/types";

/**
 * Error boundary for authentication routes.
 * Catches errors within the auth section and provides recovery UI.
 */
export default function AuthError({ error, reset }: { error: Error; reset: () => void }) {
  // Log error with structured logging
  if (process.env.NODE_ENV !== 'production') {
    clientLogger.error('Auth error boundary triggered', {
      error: error.message,
      stack: error.stack,
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
      context: { component: 'AuthErrorBoundary' },
    });
  }
  
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}


