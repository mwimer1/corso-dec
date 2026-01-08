/**
 * @fileoverview Type definitions for runtime validation
 *
 * Moved from types/validators/runtime/types.ts - contains only actually used types.
 * All unused auth validation types and SQL safety types have been removed.
 */

/* ─────────────────── Domain-level Validation Types ─────────────────── */

/** Detailed validation information for a single domain (e.g. lib/features/chat) */
export interface DomainValidationResult {
  /** Folder or capability this validation refers to */
  domain: string;
  /** Whether the domain config passes validation */
  isValid: boolean;
  /** Fatal errors that must be fixed */
  errors: string[];
  /** Non-blocking issues worth addressing */
  warnings: string[];
  /** Missing required environment variables */
  missingRequired: string[];
  /** Missing optional (but recommended) variables */
  missingOptional: string[];
}

/**
 * NOTE: ValidationState and ConfigValidationHookResult were removed as they were unused.
 * If validation hooks are needed in the future, these types should be re-introduced
 * in a domain-specific location (e.g., types/validation/hooks.ts).
 */

