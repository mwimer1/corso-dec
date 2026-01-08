'use client';

import { ErrorFallback } from "@/components/ui/organisms";

export default function AuthError({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}


