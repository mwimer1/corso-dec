/**
 * Edge-safe API surface.
 * Only export helpers that do not import Node-only modules.
 */

import type { ValidatedEnv } from '@/types/shared/config/base/types';

/** Minimal env surface allowed in Edge handlers (keys omitted if undefined). */
type EdgeEnv = Pick<
  ValidatedEnv,
  | 'NODE_ENV'
  | 'CSP_FORWARD_URI'
  | 'NEXT_PUBLIC_SENTRY_DSN'
  | 'CSP_REPORT_LOG'
  | 'CSP_REPORT_MAX_LOGS'
  | 'CORSO_USE_MOCK_DB'
  | 'CORS_ORIGINS'
> & {
  /** Alias for CORS_ORIGINS for compatibility */
  CORS_ALLOWED_ORIGINS?: string | string[];
};
export function getEnvEdge(): EdgeEnv {
  // Edge-safe: don't import server-only helpers. Read from process.env (inlined at build)
  const e: Record<string, unknown> = typeof process !== 'undefined' && (process as any).env ? (process as any).env : (globalThis as any).__env ?? {};
  const out: Partial<EdgeEnv> = {};
  if (e['NODE_ENV']) (out as any).NODE_ENV = String(e['NODE_ENV']);
  if (e['CSP_FORWARD_URI']) out.CSP_FORWARD_URI = String(e['CSP_FORWARD_URI']);
  if (e['NEXT_PUBLIC_SENTRY_DSN']) out.NEXT_PUBLIC_SENTRY_DSN = String(e['NEXT_PUBLIC_SENTRY_DSN']);
  if (typeof e['CSP_REPORT_LOG'] !== 'undefined') out.CSP_REPORT_LOG = String(e['CSP_REPORT_LOG']);
  if (typeof e['CSP_REPORT_MAX_LOGS'] !== 'undefined') (out as any).CSP_REPORT_MAX_LOGS = Number(e['CSP_REPORT_MAX_LOGS']);
  if (typeof e['CORSO_USE_MOCK_DB'] !== 'undefined') (out as any).CORSO_USE_MOCK_DB = (String(e['CORSO_USE_MOCK_DB']) === 'true' ? 'true' : 'false');
  if (typeof e['CORS_ORIGINS'] !== 'undefined') out.CORS_ORIGINS = String(e['CORS_ORIGINS']);
  if (typeof e['CORS_ALLOWED_ORIGINS'] !== 'undefined') (out as any).CORS_ALLOWED_ORIGINS = e['CORS_ALLOWED_ORIGINS'];
  return out as EdgeEnv;
}



