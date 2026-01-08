/**
 * Base application error class for infrastructure components
 */
import { ErrorCategory, ErrorSeverity } from './types';

export class ApplicationError extends Error {
  readonly code: string;
  readonly category: ErrorCategory;
  readonly severity: ErrorSeverity;
  readonly context?: Record<string, unknown> | undefined;
  readonly originalError?: Error | undefined;

  // Overload signatures
  constructor(message: string, code: string, category?: ErrorCategory, severity?: ErrorSeverity);
  constructor(args: ApplicationErrorArgs);

  // Implementation
  constructor(
    messageOrArgs: string | ApplicationErrorArgs,
    code?: string,
    category: ErrorCategory = ErrorCategory.UNHANDLED,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
  ) {
    if (typeof messageOrArgs === 'string') {
      // Positional arguments style
      const message = messageOrArgs;
      super(message);
      this.code = code ?? 'UNKNOWN';
      this.category = category;
      this.severity = severity;
      this.context = undefined;
      this.originalError = undefined;
    } else {
      // Object argument style
      const { message, code: objCode, category: objCat = ErrorCategory.UNHANDLED, severity: objSev = ErrorSeverity.ERROR, context, originalError } = messageOrArgs;
      super(message);
      this.code = objCode;
      this.category = objCat;
      this.severity = objSev;
      this.context = context;
      this.originalError = originalError;
    }

    this.name = 'ApplicationError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError);
    }
  }
}

interface ApplicationErrorArgs {
  message: string;
  code: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  originalError?: Error;
}

