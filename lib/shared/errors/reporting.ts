
/**
 * Error reporting / dispatch helper
 * @module lib/shared/error/reporting
 */

// Note: avoid importing server-only env helper at module top-level to keep this
// module bundlable in client/edge contexts. Use process.env fallback below.
import { v4 as uuidv4 } from 'uuid';
import { LRUCache } from '@/lib/shared/cache/lru-cache';
import { isProduction } from '@/lib/shared/config/client';

interface LoggerLike {
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
}


function createConsoleLogger(): LoggerLike {
  return {
    error: (...args: unknown[]) => console.error(...args),
    warn: (...args: unknown[]) => console.warn(...args),
    info: (...args: unknown[]) => console.info(...args),
  };
}

// Default to console logger; servers may register a custom dispatcher instead
let logger: LoggerLike = createConsoleLogger();

import { ApplicationError } from './application-error';
import {
    ErrorCategory,
    ErrorSeverity,
    type AppError,
    type ErrorContext,
} from './types';

/* ------------------------------------------------------------ */
/* Dispatcher (e.g. send to Sentry, Slack, etc.)                */
/* ------------------------------------------------------------ */

let errorDispatcher: ((error: AppError) => void) | null = null;

interface ReportOptions {
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  context?: Partial<ErrorContext>;
  /** If true, suppress console log (still goes to dispatcher). */
  silent?: boolean;
}

/* ------------------------------------------------------------ */
/* Global dev buffer for quick access in the console            */
/* ------------------------------------------------------------ */


declare global {
  // dev‑only ring‑buffer (last 10 errors)
  var __recentErrors__: LRUCache<string, AppError> | undefined;
}

/* ------------------------------------------------------------ */
/* Public API                                                   */
/* ------------------------------------------------------------ */

/**
 * Report an error or message and receive a stable error‑ID.
 */
export function reportError(
  errOrMsg: Error | string,
  {
    category = ErrorCategory.UNHANDLED,
    severity = ErrorSeverity.ERROR,
    context = {},
    silent = false,
  }: ReportOptions = {},
): string {
  const originalErr =
    typeof errOrMsg === 'string' ? new Error(errOrMsg) : errOrMsg;

  const errorId = uuidv4();
  const timestamp = new Date().toISOString();

  const appError: AppError = {
    id: errorId,
    message: originalErr.message || 'Unknown error',
    code:
      originalErr instanceof ApplicationError
        ? originalErr.code
        : 'UNKNOWN_ERROR',
    category,
    severity,
    context: { timestamp, ...context },
    originalError: originalErr,
    stack: originalErr.stack ?? '',
  };

  /* -------- local log -------- */
  if (!silent) {
    const log =
      severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.ERROR
        ? logger.error
        : severity === ErrorSeverity.WARNING
          ? logger.warn
          : logger.info;

    log(`[${category}] ${appError.message}`, {
      errorId,
      category,
      severity,
      context: appError.context,
      stack: appError.stack,
    });
  }

  /* -------- dev buffer -------- */
  // Allowed: dev-only error buffer (runtime compatibility)
  if (!isProduction()) {
    globalThis.__recentErrors__ ??= new LRUCache<string, AppError>(10);
    globalThis.__recentErrors__.put(errorId, appError);
  }

  /* -------- external sink -------- */
  errorDispatcher?.(appError);

  return errorId;
}

