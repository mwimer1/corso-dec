'use client';

import { ErrorFallback } from "@/components/ui/organisms";

export default function MarketingError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}

