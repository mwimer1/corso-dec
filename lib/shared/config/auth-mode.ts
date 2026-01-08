/**
 * @fileoverview Auth Mode Configuration (Client + Server Safe)
 * 
 * Safe to import in both client and server contexts.
 * Reads NEXT_PUBLIC_AUTH_MODE directly from process.env.
 */

/**
 * Safe accessor for environment variables that tolerates missing `process.env`
 * when the file is imported in Edge or client build contexts.
 */
function safeGetEnv(key: string): string | undefined {
  try {
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
 * Check if relaxed auth mode is enabled.
 * 
 * In relaxed mode:
 * - Organization membership is optional
 * - RBAC checks are bypassed
 * - Any signed-in user can access protected resources
 * 
 * Guard rails:
 * - Requires explicit opt-in via ALLOW_RELAXED_AUTH=true
 * - **CRITICAL**: Cannot be enabled in production - will throw error
 * - Defaults to 'strict' if not set
 * 
 * @throws {Error} If relaxed auth mode is attempted in production environment
 */
export function isRelaxedAuthMode(): boolean {
  const mode = safeGetEnv('NEXT_PUBLIC_AUTH_MODE');
  const allowRelaxed = safeGetEnv('ALLOW_RELAXED_AUTH') === 'true';
  const nodeEnv = safeGetEnv('NODE_ENV');
  
  // Require explicit opt-in
  if (mode === 'relaxed' && !allowRelaxed) {
    if (nodeEnv !== 'production') {
      console.warn(
        '⚠️  NEXT_PUBLIC_AUTH_MODE=relaxed requires ALLOW_RELAXED_AUTH=true to enable. ' +
        'Relaxed mode is currently DISABLED. Set ALLOW_RELAXED_AUTH=true in .env.local to enable.'
      );
    }
    return false;
  }
  
  const isRelaxed = mode === 'relaxed' && allowRelaxed;
  
  // CRITICAL: Fail fast in production - relaxed auth mode is a security risk
  if (isRelaxed && nodeEnv === 'production') {
    throw new Error(
      'SECURITY ERROR: Relaxed auth mode cannot be enabled in production. ' +
      'This mode bypasses organization membership and RBAC checks, creating a critical security vulnerability. ' +
      'Remove NEXT_PUBLIC_AUTH_MODE=relaxed and ALLOW_RELAXED_AUTH=true from production environment variables.'
    );
  }
  
  return isRelaxed;
}

