/**
 * @fileoverview Client-Safe Core Infrastructure Barrel Export
 * @module lib/core/client
 * @description Re-exports client-safe utilities for use in browser/client code.
 *
 * Use this module in client components and any code that runs in the browser.
 * For server-only utilities (auth, env, middleware, integrations), import from
 * `@/lib/core/server` instead.
 */

// ValidatorResult alias removed - was unused per audit
// SecurityConfig and ValidationResult removed - unused exports per dead code audit

/* ── Errors (Client-Safe) ─────────────────────────────────────────────────── */
/**
 * Exports the ApplicationError class for client-safe error handling.
 */
export { ApplicationError } from '@/lib/shared/errors/application-error';
/**
 * Exports error category and severity enums for client-safe error classification.
 */
export { ErrorCategory, ErrorSeverity } from '@/lib/shared/errors/types';
/* ── Validation (Client-Safe) ─────────────────────────────────────────────── */
/**
 * Exports assertZodSchema for client-side Zod validation assertion.
 */
// assertZodSchema removed - was causing import issues

// (Removed) Event bus utilities were deprecated and removed.

/* ── Logging & Public Env (Client-Safe) ───────────────────────────────────── */
/**
 * Exports the clientLogger and publicEnv for client-safe logging and environment access.
 */
export { logger as clientLogger } from '@/lib/shared/config/client';

/* ── Billing Types (Client-Safe) ──────────────────────────────────────────── */
/**
 * Note: Custom billing types removed - Clerk handles all billing operations.
 * No billing types exported from client barrel.
 */

