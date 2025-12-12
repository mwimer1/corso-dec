/**
 * @fileoverview Custom validation error class
 * @module lib/shared/errors/validation-error
 */
import type { ZodError, ZodIssue } from 'zod';

/**
 * Base validation error interface
 * @description Standard validation error structure
 */
export interface IValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Custom validation error class
 * @description Enhanced error class for validation failures
 */
export class ValidationError extends Error {
  public readonly errors: IValidationError[];
  public readonly field?: string;
  public readonly code: string;

  constructor(
    message: string,
    errors: IValidationError[] = [],
    field?: string,
    code = 'VALIDATION_ERROR'
  ) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
    if (field !== undefined) {
      this.field = field;
    }
    this.code = code;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }

  /**
   * Create ValidationError from ZodError
   */
  static fromZodError(zodError: ZodError, contextMessage?: string): ValidationError {
    const errors: IValidationError[] = zodError.errors.map((issue: ZodIssue) => ({
      field: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code,
      value: 'received' in issue ? issue.received : undefined,
      metadata: {
        expected: 'expected' in issue ? issue.expected : undefined,
        unionErrors: 'unionErrors' in issue ? issue.unionErrors : undefined,
      },
    }));

    return new ValidationError(
      contextMessage || 'Validation failed',
      errors,
      undefined,
      'SCHEMA_VALIDATION_ERROR'
    );
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      field: this.field,
      errors: this.errors,
      stack: this.stack,
    };
  }
} 

