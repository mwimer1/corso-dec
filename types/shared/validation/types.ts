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

/** Aggregate validation state returned by the validation API */
export interface ValidationState {
  /** Overall pass/fail flag across all domains */
  isValid: boolean;
  /** Number of domains analysed */
  totalDomains: number;
  /** Count of domains that passed validation */
  validDomains: number;
  /** Count of domains that failed validation */
  invalidDomains: number;
  /** Total errors across all domains */
  totalErrors: number;
  /** Total warnings across all domains */
  totalWarnings: number;
  /** Detailed per-domain results */
  results: DomainValidationResult[];
  /** Production-readiness flag */
  productionReady?: boolean;
  /** Blocking issues preventing prod deploy */
  blockers?: string[];
  /** Recommended next actions */
  recommendations?: string[];
}

/** Return type of the `useConfigValidation` React hook */
export interface ConfigValidationHookResult {
  validation: ValidationState | null;
  loading: boolean;
  error: string | null;
  /** Re-trigger validation fetch */
  refresh: () => Promise<void>;
  [key: string]: ValidationState | null | boolean | string | null | (() => Promise<void>);
}

