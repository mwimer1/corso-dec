import { getEnvEdge } from '@/lib/integrations/env';
// Add type-only imports for static analysis

/**
 * Performance monitoring and observability setup.
 * This file is called once when the server starts.
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // DOCUMENTED EXCEPTION: NEXT_RUNTIME detection requires direct process.env access.
  // This is a Next.js framework requirement for runtime detection in this specific file.
  // All other environment variable access should go through the validated `env` object.
  const _runtime = process.env['NEXT_RUNTIME'];
  const env = getEnvEdge(['NODE_ENV', 'NEXT_RUNTIME']);

  // Sentry integration removed - using alternative monitoring approach

  // Enhanced performance monitoring is enabled only in production.
  const isMonitoringEnabled = env.NODE_ENV === 'production';

  if (isMonitoringEnabled) {
    // Additional performance monitoring can be configured here
  }
}

// Note: OpenTelemetry integration for Sentry v8+ not available in v9.42.1
// export * from '@sentry/nextjs/otel';


