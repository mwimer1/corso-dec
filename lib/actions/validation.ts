// lib/actions/shared/validation.ts
// shared validation (isomorphic)

import { ApplicationError, ErrorCategory, ErrorSeverity } from "@/lib/shared";
import { z } from "zod";

/**
 * Validates input using Zod schema and throws ApplicationError on failure.
 */
export function validateInput<T>(schema: z.ZodSchema<T>, input: unknown, context: string): T {
  const validation = schema.safeParse(input);
  if (!validation.success) {
    throw new ApplicationError({
      code: "VALIDATION_ERROR",
      message: `Invalid input for ${context}.`,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      context: { errors: validation.error.flatten() },
    });
  }
  return validation.data;
}

/**
 * Handles Zod validation errors and converts them to ApplicationError.
 */
export function handleValidationError(err: unknown, context: string): never {
  if (err instanceof z.ZodError) {
    throw new ApplicationError({
      message: `Invalid data for ${context}.`,
      code: "VALIDATION_ERROR",
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.WARNING,
      context: { errors: err.flatten() },
    });
  }
  throw err;
} 

