/**
 * @fileoverview Client-Safe Configuration and Utilities
 *
 * IMPORTANT: This file is Edge-safe and client-compatible. It must never import
 * server-only modules or access non-public environment variables.
 *
 * Hidden Dependencies:
 * - Next.js build process injects NEXT_PUBLIC_* variables at build time
 * - Browser environment provides access to client-side APIs (fetch, console)
 * - Server-side rendering (SSR) may provide server env vars during hydration
 * - Mock DB feature requires USE_MOCK_DB flag for development
 *
 * Runtime Behavior:
 * - Browser: Only NEXT_PUBLIC_* variables are available
 * - SSR: Both server and public env vars are accessible during render
 * - Edge Runtime: Only public env vars are available (no server env access)
 * - Build Time: All env vars are statically replaced
 *
 * Security Constraints:
 * - Never expose sensitive data (API keys, secrets, internal URLs)
 * - All exposed values must be safe for client-side consumption
 * - Third-party service keys (Stripe, Clerk) are acceptable for client use
 */

// Removed: httpFetch - unused per dead code audit
// Use native fetch() directly in client code

/**
 * Client-safe logger that maps to browser console APIs
 * Safe for use in client components and edge functions
 */
export const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

/**
 * Public Environment Variables Interface
 *
 * IMPORTANT: Only NEXT_PUBLIC_* variables are available in client/edge contexts.
 * All other environment variables are server-only and will be undefined.
 *
 * Hidden Dependencies:
 * - USE_MOCK_DB: Enables CSV-backed mock database for development
 * - NEXT_PUBLIC_APP_URL: Required for proper client-side navigation
 * - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: Required for client-side authentication
 * - NEXT_PUBLIC_SUPABASE_URL/KEY: Required for client-side database access
 *
 * Edge Runtime Constraints:
 * - Only NEXT_PUBLIC_* variables are available in Edge functions
 * - Server environment variables (USE_MOCK_DB) are not accessible in Edge runtime
 * - Build-time constants are statically replaced during compilation
 */
import { z } from 'zod';

const PublicEnvSchema = z.object({
  USE_MOCK_DB: z.boolean(),

  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_APP_NAME: z.string().optional(),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  NEXT_PUBLIC_STAGE: z.string().optional(),

  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.string().optional(),
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.string().optional(),

  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),

  NEXT_PUBLIC_INTERCOM_APP_ID: z.string().optional(),

  NEXT_PUBLIC_PLACEHOLDER_IMAGE_BASE: z.string().optional(),

  // AG Grid Enterprise license (public by design)
  // Accept both NEXT_PUBLIC_AGGRID_LICENSE_KEY (canonical) and NEXT_PUBLIC_AG_GRID_LICENSE_KEY (legacy)
  NEXT_PUBLIC_AGGRID_LICENSE_KEY: z.string().min(1).optional(),
  // Accept both NEXT_PUBLIC_AGGRID_ENTERPRISE and NEXT_PUBLIC_AG_GRID_ENTERPRISE (legacy)
  NEXT_PUBLIC_AGGRID_ENTERPRISE: z.string().optional(),

  // Mock AI mode for development/testing (bypasses real API calls)
  NEXT_PUBLIC_USE_MOCK_AI: z.string().optional(),
}).strict();

type PublicEnv = z.infer<typeof PublicEnvSchema>;

/** Edge/client-safe production check backed by NODE_ENV parsing. */
export function isProduction(): boolean {
  const nodeEnv = safeGetEnv('NODE_ENV');
  return (nodeEnv ?? '').toLowerCase() === 'production';
}

/**
 * Converts string environment variable to boolean
 * Handles various truthy/falsy representations
 * @param v - Environment variable value (string | undefined)
 * @returns boolean value
 */
function toBool(v: string | undefined): boolean {
  const s = (v ?? '').trim().toLowerCase();
  return s === '1' || s === 'true';
}

/**
 * Safe accessor for environment variables that tolerates missing `process.env`
 * when the file is imported in Edge or client build contexts where `process`
 * may be undefined or polyfilled differently during compile-time.
 */
function safeGetEnv(key: string): string | undefined {
  try {
    // Some build environments replace process.env at compile time; guard runtime access
    // in case `process` is undefined during certain Next.js build phases.
    const processLike = (globalThis as { process?: { env?: NodeJS.ProcessEnv } }).process;
    if (!processLike || typeof processLike !== 'object') return undefined;

    const { env } = processLike;
    if (!env || typeof env !== 'object') return undefined;

    const value = env[key];
    return typeof value === 'string' ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Public Environment Configuration
 *
 * IMPORTANT: This object is cached and must remain immutable after initialization.
 * It combines server and client environment variables with proper precedence.
 *
 * Hidden Dependencies:
 * - Server-side rendering (SSR) may provide server environment variables during hydration
 * - Browser bundles only receive NEXT_PUBLIC_* variables at build time
 * - Mock DB feature requires server-side USE_MOCK_DB flag
 * - Build process statically replaces environment variables
 *
 * Runtime Behavior:
 * - SSR: Access to both server and public environment variables
 * - Browser: Only NEXT_PUBLIC_* variables available after hydration
 * - Edge Runtime: Only NEXT_PUBLIC_* variables available (no server env access)
 * - Build Time: Static replacement of all available environment variables
 */

// Initialize cache immediately to avoid IIFE during build configuration collection
let _cache: PublicEnv | undefined;

export const publicEnv: PublicEnv = (() => {
  if (_cache) return _cache as PublicEnv;

  // Build the environment configuration
  const useMockFromServer = safeGetEnv('USE_MOCK_DB');
  const USE_MOCK_DB = toBool(useMockFromServer ?? 'false');

  const obj = {
    USE_MOCK_DB,

    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: safeGetEnv('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: safeGetEnv('NEXT_PUBLIC_CLERK_SIGN_IN_URL'),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: safeGetEnv('NEXT_PUBLIC_CLERK_SIGN_UP_URL'),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: safeGetEnv('NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL'),
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: safeGetEnv('NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL'),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: safeGetEnv('NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL'),
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: safeGetEnv('NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL'),

    NEXT_PUBLIC_APP_URL: safeGetEnv('NEXT_PUBLIC_APP_URL'),
    NEXT_PUBLIC_APP_NAME: safeGetEnv('NEXT_PUBLIC_APP_NAME'),
    NEXT_PUBLIC_APP_VERSION: safeGetEnv('NEXT_PUBLIC_APP_VERSION'),
    NEXT_PUBLIC_API_URL: safeGetEnv('NEXT_PUBLIC_API_URL'),
    NEXT_PUBLIC_SITE_URL: safeGetEnv('NEXT_PUBLIC_SITE_URL'),
    NEXT_PUBLIC_STAGE: safeGetEnv('NEXT_PUBLIC_STAGE'),

    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: safeGetEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'),
    NEXT_PUBLIC_SUPABASE_URL: safeGetEnv('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: safeGetEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    NEXT_PUBLIC_SENTRY_DSN: safeGetEnv('NEXT_PUBLIC_SENTRY_DSN'),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: safeGetEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),
    // Intercom removed for MVP: keep undefined to avoid accidental usage
    NEXT_PUBLIC_INTERCOM_APP_ID: undefined,

    NEXT_PUBLIC_PLACEHOLDER_IMAGE_BASE: safeGetEnv('NEXT_PUBLIC_PLACEHOLDER_IMAGE_BASE'),

    // AG Grid Enterprise license (public by design)
    // Accept both NEXT_PUBLIC_AGGRID_LICENSE_KEY (canonical) and NEXT_PUBLIC_AG_GRID_LICENSE_KEY (legacy)
    NEXT_PUBLIC_AGGRID_LICENSE_KEY: safeGetEnv('NEXT_PUBLIC_AGGRID_LICENSE_KEY') ?? safeGetEnv('NEXT_PUBLIC_AG_GRID_LICENSE_KEY'),
    // Accept both NEXT_PUBLIC_AGGRID_ENTERPRISE and NEXT_PUBLIC_AG_GRID_ENTERPRISE (legacy)
    NEXT_PUBLIC_AGGRID_ENTERPRISE: safeGetEnv('NEXT_PUBLIC_AGGRID_ENTERPRISE') ?? safeGetEnv('NEXT_PUBLIC_AG_GRID_ENTERPRISE') ?? safeGetEnv('AGGRID_ENTERPRISE') ?? safeGetEnv('AG_GRID_ENTERPRISE'),

    // Mock AI mode for development/testing
    NEXT_PUBLIC_USE_MOCK_AI: safeGetEnv('NEXT_PUBLIC_USE_MOCK_AI'),
  };

  _cache = PublicEnvSchema.parse(obj);
  return _cache;
})();

export default {
  logger,
  publicEnv,
};

