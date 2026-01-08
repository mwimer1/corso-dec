/**
 * @fileoverview Type definitions for runtime validation
 *
 * This file contains only type definitions extracted from the original runtime-validation.types.ts.
 * All runtime code has been moved to lib/shared/validation.ts.
 */

/** Field-specific validation error - compatible with IValidationError from lib/shared/errors/validation-error */
interface FieldError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
  metadata?: Record<string, unknown>;
}

/* ─────────────────────── Validation Result Types ──────────────────────── */

/**
 * Result of runtime validation with type safety
 * @aiContext Used for validation operations that may succeed or fail
 * @aiPurpose Provides type-safe validation results with detailed error information
 */
export type ValidationResult<T> =
  | { success: true; data: T; errors?: never }
  | { success: false; data?: never; errors: FieldError[] };

/**
 * Configuration for validation behavior
 * @aiContext Used to control validation strictness and error handling
 */
export interface ValidationConfig {
  /** Whether to throw on validation failure or return result */
  throwOnError?: boolean;
  /** Whether to collect all errors or stop at first error */
  collectAllErrors?: boolean;
  /** Custom error message prefix */
  errorPrefix?: string;
  /** Whether to include field paths in error messages */
  includeFieldPaths?: boolean;
}

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

/* ─────────────────── Auth validation payloads (compile-time only) ─────────────────── */

export interface UserRegistrationValidation {
  email: string;
  password: string;
  name: string;
  terms_accepted: true;
  marketing_consent?: boolean;
  organization_name?: string;
  invite_code?: string;
}

export interface UserLoginValidation {
  email: string;
  password: string;
  remember_me?: boolean;
  captcha_token?: string;
}

export interface PasswordResetValidation {
  email: string;
  reset_token?: string;
  new_password?: string;
  confirm_password?: string;
}

export interface MfaValidation {
  mfa_type: 'totp' | 'sms' | 'email';
  code: string;
  backup_code?: string;
  remember_device?: boolean;
}

export interface PasswordStrengthValidation {
  password: string;
}

export interface EmailVerificationValidation {
  email: string;
  verification_code: string;
  expires_at?: Date;
}

export interface SessionValidation {
  user_id: string;
  session_token: string;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
}

export interface ApiKeyValidation {
  name: string;
  permissions: string[];
  expires_at?: Date;
  ip_whitelist?: string[];
}

export interface OauthValidation {
  provider: 'google' | 'github' | 'microsoft';
  code: string;
  state: string;
  redirect_uri: string;
  code_verifier?: string;
}

// Removed: UserProfileValidation - superseded by Clerk UserProfile UI

