// lib/integrations/supabase/server.ts
import { getEnv } from '@/lib/server/env';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import type { Database } from '@/types/integrations';
import type { SupabaseClient } from '@supabase/supabase-js';
import type * as SupabaseJs from '@supabase/supabase-js';
// Delay Supabase SDK import until first use (avoids side effects on import)
import 'server-only';

/**
 * Read Supabase env vars and return a TLS-enforced URL with the corresponding key/token.
 * Normalizes http→https and enforces https, throwing a structured error if invalid.
 */
function getSecureSupabaseConfig(urlEnvKey: string, secretEnvKey: string): {
  secureUrl: string;
  secret: string;
} {
  // Read env safely at call-time. Avoid throwing or accessing properties on undefined values.
  const env = (() => {
    try {
      return getEnv() as Record<string, string> | undefined;
    } catch {
      // Fall back to process.env for build/test environments where getEnv may be unavailable
      return process.env as Record<string, string> | undefined;
    }
  })();

  const url = env?.[urlEnvKey] ?? process.env[urlEnvKey];
  const secret = env?.[secretEnvKey] ?? process.env[secretEnvKey];

  if (!url || !secret) {
    throw new ApplicationError({
      message: 'Missing Supabase configuration',
      code: 'SUPABASE_CONFIG_ERROR',
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.CRITICAL,
      context: { urlEnvKey, secretEnvKey },
    });
  }

  const secureUrl = String(url).startsWith('http://') ? String(url).replace('http://', 'https://') : String(url);
  if (!secureUrl.startsWith('https://')) {
    throw new ApplicationError({
      message: 'Supabase URL must use TLS (https).',
      code: 'SUPABASE_TLS_REQUIRED',
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.CRITICAL,
      context: { urlEnvKey },
    });
  }

  return { secureUrl, secret };
}

/* ------------------------------------------------------------------ */
/* Singleton state (HMR-safe)                                         */
/* ------------------------------------------------------------------ */

let __admin__: SupabaseClient<Database, 'public'> | undefined;

/* ------------------------------------------------------------------ */
/* Factory: create or return cached Supabase client                   */
/* ------------------------------------------------------------------ */

export function getSupabaseAdmin(): SupabaseClient<Database, 'public'> {
  if (__admin__) return __admin__;
  const { secureUrl, secret: SUPABASE_SERVICE_ROLE_KEY } = getSecureSupabaseConfig('SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY');
  // Import createClient on demand to avoid running Supabase code at module import
  const { createClient } = require('@supabase/supabase-js') as typeof SupabaseJs;
  __admin__ = createClient<Database, 'public'>(secureUrl, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    global: { fetch },
  });
  return __admin__;
}



/* Removed unused QuerySecurityOptions interface (caused TS6196). */
/* validateQuerySecurity helper was previously removed as dead code. */


