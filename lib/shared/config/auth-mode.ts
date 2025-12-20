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
 * Defaults to 'strict' if not set.
 */
export function isRelaxedAuthMode(): boolean {
  const mode = safeGetEnv('NEXT_PUBLIC_AUTH_MODE');
  return mode === 'relaxed';
}

