'use client';
import { cn } from '@/styles';
import { containerMaxWidthVariants } from '@/styles/ui/shared';
import { type FallbackProps } from 'react-error-boundary';

/**
 * Error fallback component with accessibility support.
 * Displays user-friendly error messages with recovery options.
 */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className={cn(containerMaxWidthVariants({ maxWidth: 'md', centered: true }))}>
      <div 
        role="alert" 
        aria-live="assertive"
        className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-4 text-destructive"
      >
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="mt-2 text-sm" aria-label={`Error: ${error.message}`}>
            {error.message}
          </p>
        </div>
        <button
          onClick={resetErrorBoundary}
          aria-label="Try again to recover from error"
          className="ml-auto rounded bg-primary px-3 py-2 text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
