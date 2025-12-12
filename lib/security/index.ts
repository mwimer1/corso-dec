/**
 * Security Domain Barrel (`lib/security`)
 * Public, client-safe surface only. Keep minimal to avoid barrel drift and boundary leaks.
 *
 * If a cross-domain consumer truly needs a symbol via the barrel,
 * add that export intentionally here (with rationale in the PR).
 */

// Intentionally minimal:
// No wildcard re-exports; no server-only modules; no speculative surface.
// Add targeted exports here only if they're truly used via '@/lib/security'.

export { maskSensitiveData } from './utils/masking';


