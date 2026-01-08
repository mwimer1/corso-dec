// lib/shared/errors/browser.ts
// FILE: lib/errors/browser.ts
'use client';

import { reportError } from './reporting';
import { ErrorCategory, ErrorSeverity } from './types';

/**
 * Reports browser errors with consistent logging and error handling
 *
 * @param error - The error to report
 * @param context - Context information about where the error occurred
 */
export function reportBrowserError(error: unknown, context: string): void {
  const appError = _ensureError(error);
  // Preserve original console signature for tests/behavior
  console.error(`${context} failed:`, error as any);
  reportError(appError, {
    category: ErrorCategory.UNHANDLED,
    severity: ErrorSeverity.ERROR,
    context: { source: context }
  });
}

/** Returns an Error instance for any unknown input, preserving message. */
function _ensureError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  try { return new Error(String(value)); } catch { return new Error('Unknown error'); }
}

