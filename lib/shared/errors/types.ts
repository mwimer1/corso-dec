 
/**
 * @fileoverview Shared error primitives
 * @module      lib/shared/error/types
 */

// Note: Do not re-export ApplicationError here to avoid a circular dependency
// with './application-error'. Import ApplicationError from the barrel
// '@/lib/shared/errors' or directly from './application-error' where needed.

/* ------------------------------------------------------------------ */
/* Categories & severity                                              */
/* ------------------------------------------------------------------ */

/** High‑level error buckets used for metrics & alert routing. */
export enum ErrorCategory {
  UNHANDLED = 'UNHANDLED',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS_RULE = 'BUSINESS_RULE',
  SECURITY = 'SECURITY',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  CONFIGURATION = 'CONFIGURATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  INTEGRATION = 'INTEGRATION',
  INTERNAL = 'INTERNAL',
  API = 'API',
  RENDERING = 'RENDERING',
}

/** How noisy / urgent the error is. */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

// Removed: ErrorCode enum - unused per dead code audit
// Error codes are handled via string literals in ApplicationError and ApiError types

/* ------------------------------------------------------------------ */
/* Base error class                                                   */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Wire format                                                        */
/* ------------------------------------------------------------------ */

export interface ErrorContext {
  timestamp: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

export interface AppError {
  id: string;
  message: string;
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  context: ErrorContext;
  originalError?: Error;
  stack: string;
}

