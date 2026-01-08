'use client';

import { ErrorFallback } from "@/components/ui/organisms";
import { clientLogger } from "@/lib/core";
import { ErrorCategory, ErrorSeverity } from "@/lib/shared/errors/types";
import React from "react";

/**
 * Creates a reusable error boundary component for route groups.
 * 
 * @param context - Context name for logging (e.g., 'Auth', 'Marketing', 'Protected')
 * @param logInProduction - Whether to log errors in production (default: false)
 * @returns Error boundary component for use in route groups
 * 
 * @example
 * ```tsx
 * // app/(auth)/error.tsx
 * import { createErrorBoundary } from '@/app/shared/create-error-boundary';
 * export default createErrorBoundary({ context: 'Auth' });
 * ```
 */
export function createErrorBoundary({ 
  context, 
  logInProduction = false 
}: {
  context: string;
  logInProduction?: boolean;
}) {
  return function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
    const shouldLog = logInProduction || process.env.NODE_ENV !== 'production';
    
    React.useEffect(() => {
      if (shouldLog) {
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
        
        clientLogger.error(`${context} error boundary triggered`, {
          ...errorDetails,
          category: ErrorCategory.INTERNAL,
          severity: ErrorSeverity.ERROR,
          context: { 
            component: `${context}ErrorBoundary`,
          },
        });
      }
    }, [error, shouldLog]);
    
    return <ErrorFallback error={error} resetErrorBoundary={reset} />;
  };
}
