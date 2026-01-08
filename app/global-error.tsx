// app/global-error.tsx
// Description: Global error boundary for the Next.js app router, handles uncaught errors and displays a fallback UI.
"use client";
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
    // Client-side error logging - avoid server-only error reporting
    clientLogger.error('Global error boundary triggered', {
      error: error.message,
      stack: error.stack,
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
