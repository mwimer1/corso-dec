'use client'; // required in Next.js /app
import { logger } from '@/lib/shared/config/client';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from './error-fallback'; // reuse your existing UI

function logError(error: Error, info: React.ErrorInfo) {
  logger.error('UI crash', { error, componentStack: info.componentStack });
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
  // log the error to your preferred error-monitoring service
  logger.error(error);
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
