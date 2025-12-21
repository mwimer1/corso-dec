// lib/actions/shared/error-handling.ts
// server-agnostic helpers (no server-only import required)

import { formatErrorMessage, normalizeUnknownError } from "@/lib/shared/errors/error-utils";
import { ApplicationError, ErrorCategory, ErrorSeverity } from "@/lib/shared";

/**
 * Standardized internal error handler.
 * Converts unknown errors to ApplicationError with consistent formatting.
 */
export function handleInternalError(err: unknown, message: string): ApplicationError {
  return new ApplicationError({
    message: `${message}: ${formatErrorMessage(err, "An unknown error occurred")}`,
    code: "INTERNAL_ERROR",
    category: ErrorCategory.INTERNAL,
    severity: ErrorSeverity.ERROR,
    originalError: normalizeUnknownError(err),
  });
}

/**
 * Wraps an async function with standardized error handling.
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApplicationError) {
      throw err;
    }
    throw handleInternalError(err, errorContext);
  }
}

