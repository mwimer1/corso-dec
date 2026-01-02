// scripts/utils/env/validation.ts
import { z } from 'zod';
// IMPORTANT: never import from './index' (barrel) to avoid cycles.
// Move patterns under the same folder so it's a one-way dependency.
import * as patterns from './patterns';

// Error/result shapes match project guidance for consistency.
// Callers choose whether to exit(1); these helpers never exit.
export type EnvIssue = {
  code: 'MISSING_ENV' | 'INVALID_ENV';
  key: string;
  message: string;
  details?: unknown;
};

export type EnvValidationError = {
  success: false;
  error: {
    code: 'ENV_VALIDATION_FAILED';
    message: string;
    details: EnvIssue[];
  };
};

export type EnvValidationOk<T> = {
  success: true;
  data: T;
};

export type ValidationResult<T> = EnvValidationOk<T> | EnvValidationError;

/**
 * Validate process.env against a Zod object shape.
 * - Strict: unknown keys are ignored; only keys in the shape are returned.
 * - No top-level env reads at module scope: evaluation happens at call time.
 */
export function validateEnv<TShape extends z.ZodRawShape>(
  shape: TShape
): ValidationResult<z.infer<z.ZodObject<TShape>>> {
  const schema = z.object(shape).strict();
  const raw: Record<string, string | undefined> = {};
  for (const key of Object.keys(shape)) {
    raw[key] = process.env[key];
  }
  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { success: true, data: parsed.data };
  }
  const details: EnvIssue[] = parsed.error.issues.map((iss) => ({
    code: 'INVALID_ENV',
    key: iss.path.join('.'),
    message: iss.message,
  }));
  return {
    success: false,
    error: {
      code: 'ENV_VALIDATION_FAILED',
      message: 'Environment variables failed validation.',
      details,
    },
  };
}

/**
 * Sugar: same as validateEnv but named for discoverability.
 * 
 * @note This is intentionally an alias - both exports are used:
 * - `validateEnv`: Generic validation function
 * - `getEnv`: Convenience alias for common use case
 * 
 * Knip may flag this as a duplicate, but both names serve different purposes.
 */
export const getEnv = validateEnv;

/**
 * Enforce env at runtime; throws an Error carrying the structured payload
 * under `error.details` to make logging consistent without process.exit().
 */
export function requireServerEnv<TShape extends z.ZodRawShape>(
  shape: TShape
): z.infer<z.ZodObject<TShape>> {
  const result = validateEnv(shape);
  if (!result.success) {
    const err = new Error(result.error.message);
    // Attach structured error for callers/CI to log uniformly.
    (err as unknown as { details: EnvValidationError['error'] }).details =
      result.error;
    throw err;
  }
  return result.data;
}

/**
 * Orchestrate the legacy consolidated flow via patterns; no process.exit here.
 */
export async function runConsolidatedValidation(steps?: any[]) {
  return patterns.runConsolidatedValidation(steps);
}

/**
 * Validate AI agent development tools and environment.
 */
export async function validateAIAgentTools() {
  return patterns.validateAIAgentTools();
}

/**
 * Validate project structure and required files.
 */
export async function validateProjectStructure() {
  return patterns.validateProjectStructure();
}

