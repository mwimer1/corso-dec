// app/global-error.tsx
// Description: Global error boundary for the Next.js app router, handles uncaught errors and displays a fallback UI.
'use client';

import { ErrorFallback } from "@/components";
import { ErrorCategory, ErrorSeverity, clientLogger } from "@/lib/core";
import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  React.useEffect(() => {
    // Client-side error logging - always log global errors (no NODE_ENV check)
    // Safely extract error information, handling cases where error might not be a standard Error
    const errorMessage = error?.message ?? String(error) ?? 'Unknown error';
    const errorStack = error?.stack ?? 'No stack trace available';
    const errorName = error?.name ?? 'Error';
    
    // Safely serialize error properties for logging (avoid circular references)
    const errorDetails: Record<string, unknown> = {
      error: errorMessage,
      errorName,
      stack: errorStack,
    };
    
    // Try to extract additional error properties safely
    if (error && typeof error === 'object') {
      try {
        // Only include enumerable, non-function properties
        Object.keys(error).forEach((key) => {
          if (key !== 'message' && key !== 'stack' && key !== 'name') {
            const value = (error as unknown as Record<string, unknown>)[key];
            if (typeof value !== 'function' && typeof value !== 'object') {
              errorDetails[key] = value;
            }
          }
        });
      } catch {
        // Ignore errors during property extraction
      }
    }
    
    clientLogger.error('Global error boundary triggered', {
      ...errorDetails,
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
      context: { component: "GlobalErrorBoundary" },
    });
  }, [error]);

  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={reset}
    />
  );
}
