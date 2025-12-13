'use client';

import { ErrorFallback } from "@/components/ui/organisms";
import { clientLogger } from "@/lib/core";
import { ErrorCategory, ErrorSeverity } from "@/lib/shared/errors/types";

/**
 * Error boundary for marketing routes.
 * Catches errors within the marketing section and provides recovery UI.
 */
export default function MarketingError({ error, reset }: { error: Error; reset: () => void }) {
  // Log error with structured logging
  if (process.env.NODE_ENV !== 'production') {
    clientLogger.error('Marketing error boundary triggered', {
      error: error.message,
      stack: error.stack,
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
      context: { component: 'MarketingErrorBoundary' },
    });
  }
  
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}

