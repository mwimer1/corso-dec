// app/(protected)/dashboard/error.tsx
"use client";

import { ErrorFallback } from "@/components";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return <ErrorFallback error={error} resetErrorBoundary={reset} />;
}
