// app/(protected)/dashboard/error.tsx
"use client";

import { ErrorFallback } from "@/components";
import { clientLogger } from "@/lib/core";
import { ErrorCategory, ErrorSeverity } from "@/lib/shared/errors/types";

/**
 * Error boundary for dashboard routes.
 * Catches errors within the dashboard section and provides recovery UI.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  // Log error with structured logging
  if (process.env.NODE_ENV !== 'production') {
    clientLogger.error('Dashboard error boundary triggered', {
      error: error.message,
      stack: error.stack,
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
      context: { component: 'DashboardErrorBoundary' },
    });
  }
  
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
