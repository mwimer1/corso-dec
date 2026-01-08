'use client'; // required in Next.js /app
import { logger } from '@/lib/shared/config/client';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './error-fallback'; // reuse your existing UI

function logError(error: Error, info: React.ErrorInfo) {
  // Safely extract error information, handling cases where error might not be a standard Error
  const errorMessage = error?.message ?? String(error) ?? 'Unknown error';
  const errorStack = error?.stack ?? 'No stack trace available';
  const errorName = error?.name ?? 'Error';
  
  // Safely serialize error properties for logging (avoid circular references)
  const errorDetails: Record<string, unknown> = {
    error: errorMessage,
    errorName,
    stack: errorStack,
    componentStack: info.componentStack,
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
  
  logger.error('UI crash', errorDetails);
  // e.g. Sentry.captureException(error, { extra: info });
}

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

function fallbackRender({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  // Safely extract error information for logging
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
  
  // log the error to your preferred error-monitoring service
  logger.error('App error boundary fallback triggered', errorDetails);
  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={resetErrorBoundary}
      // optional props to customize the fallback UI:
      // title="Something went wrong"
      // message="Sorry, we encountered an unexpected error. Please try again."
    />
  );
}

export function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  const [resetKey, setResetKey] = React.useState(0);
  return (
    <ErrorBoundary
      resetKeys={[children, resetKey]}
      key={resetKey}
      fallbackRender={fallbackRender}
      onError={logError}
      onReset={() => {
        // Avoid logging complex circular objects from details to prevent JSON serialization errors in tests
        logger.info('Error boundary reset');
        // Force remount to ensure clean state after reset
        setResetKey((k) => k + 1);
      }}
    >
      {children}
    </ErrorBoundary>
  );
} 
