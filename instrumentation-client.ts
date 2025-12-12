"use client";
// Add type-only import for static analysis

// Sentry integration removed - using alternative monitoring approach

// Export router transition start hook for navigation instrumentation
export const onRouterTransitionStart = async (
  ...args: any[]
) => {
  try {
    const mod = (await import('@sentry/nextjs')) as any;
    return mod?.captureRouterTransitionStart?.(...args);
  } catch {
    return undefined;
  }
};

