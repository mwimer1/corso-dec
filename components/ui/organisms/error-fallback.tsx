'use client';
import { cn } from '@/styles';
import { containerMaxWidthVariants } from '@/styles/ui/shared/container-base';
import { type FallbackProps } from 'react-error-boundary';

/* Optional: reuse your existing fallback component but typed correctly */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className={cn(containerMaxWidthVariants({ maxWidth: 'md', centered: true }))}>
      <div role="alert" className="rounded-lg border-l-4 border-destructive bg-destructive/10 p-4 text-destructive">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <pre className="mt-2 whitespace-pre-wrap text-sm">{error.message}</pre>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="ml-auto rounded bg-primary px-3 py-2 text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary focus-visible:ring-offset-background"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
