 
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

/**
 * Standard application error codes. Extend as needed.
 */
export enum ErrorCode {
  // SQL-related errors
  INVALID_SQL_INPUT = 'INVALID_SQL_INPUT',
  SUSPICIOUS_SQL_PATTERN = 'SUSPICIOUS_SQL_PATTERN',
  INVALID_QUERY_TYPE = 'INVALID_QUERY_TYPE',
  
  // External service errors
  CLICKHOUSE_QUERY_FAILED = 'CLICKHOUSE_QUERY_FAILED',

  // General application errors
  CONFIG_ERROR = 'CONFIG_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
}

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

