/**
 * Minimal env validation surface used by scripts/utils/env-validation-consolidated.ts
 * Keep extremely lightweight; fill out later with real checks per domain.
 */

// Conditionally import server-only to handle client-side execution contexts
if (typeof window === 'undefined') {
  try {
    // Only import server-only in server-side contexts
    require('server-only');
  } catch {
    // Ignore if server-only is not available
  }
}



/**
 * Returns a conservative "valid" status (no-op) so tests can import and run
 * the consolidator without tripping over a missing module.
 * Expand with domain checks as needed.
 */
import { getEnv } from '@/lib/server/env';
import type { DomainValidationResult } from '@/types/shared';

/**
 * Domain-specific configuration validation
 * Validates that environment variables are properly configured for each lib domain
 *
 * Moved from `lib/validators/domain-configs.ts` to shared validation
 * as this is a cross-cutting utility used for startup validation,
 * health checks, and environment verification across all domains.
 */

/**
 * Helper function to create a domain validation result with default values
 */
function createDomainValidationResult(domain: string): DomainValidationResult {
  return {
    domain,
    isValid: true,
    errors: [],
    warnings: [],
    missingRequired: [],
    missingOptional: [],
  };
}


/**
 * Security domain configuration validation
 */
export function validateSecurityConfig(): DomainValidationResult {
  const result = createDomainValidationResult('lib/core/security');

  // Core security requirements
  if (!getEnv().CLERK_SECRET_KEY) {
    result.errors.push('CLERK_SECRET_KEY is required for authentication');
    result.missingRequired.push('CLERK_SECRET_KEY');
    result.isValid = false;
  }

  if (!getEnv().SUPABASE_SERVICE_ROLE_KEY) {
    result.errors.push('SUPABASE_SERVICE_ROLE_KEY is required for database access');
    result.missingRequired.push('SUPABASE_SERVICE_ROLE_KEY');
    result.isValid = false;
  }

  if (!getEnv().SUPABASE_URL) {
    result.errors.push('SUPABASE_URL is required for database access');
    result.missingRequired.push('SUPABASE_URL');
    result.isValid = false;
  }

  // External SSO validation
  // External SSO support removed. No JWKS/issuer validation required.

  // Optional security features
  if (!getEnv().TURNSTILE_SECRET_KEY) {
    result.warnings.push('Turnstile bot protection not configured');
    result.missingOptional.push('TURNSTILE_SECRET_KEY');
  }

  if (!getEnv().CSP_REPORT_URI) {
    result.warnings.push('CSP reporting not configured');
    result.missingOptional.push('CSP_REPORT_URI');
  }

  return result;
}
