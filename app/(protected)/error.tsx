'use client';

import { ErrorFallback } from "@/components/ui/organisms";
import { clientLogger } from "@/lib/core";
import { ErrorCategory, ErrorSeverity } from "@/lib/shared/errors/types";

/**
 * Error boundary for protected routes.
 * Catches errors within the (protected) route group and provides recovery UI.
 */
export default function ProtectedError({ error, reset }: { error: Error; reset: () => void }) {
  // Log error with structured logging instead of console.error
  if (process.env.NODE_ENV !== 'production') {
    clientLogger.error('Protected route error boundary triggered', {
      error: error.message,
      stack: error.stack,
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
      context: { component: 'ProtectedErrorBoundary' },
    });
  }
  
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}


