/**
 * @fileoverview Custom security validation error class
 * @module lib/shared/errors/security-validation-error
 */
import { ValidationError } from './validation-error';

/**
 * Security validation error class
 * @description Specialized error for security validation failures
 */
export class SecurityValidationError extends ValidationError {
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly threatType?: string;

  constructor(
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    threatType?: string,
    field?: string
  ) {
    super(message, [], field, 'SECURITY_VALIDATION_ERROR');
    this.name = 'SecurityValidationError';
    this.severity = severity;
    if (threatType !== undefined) {
      this.threatType = threatType;
    }
  }
} 

