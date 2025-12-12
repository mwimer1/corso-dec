import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';

/* ------------------------------------------------------------------ */
/* Types                                                             */
/* ------------------------------------------------------------------ */

export type ClickParams = Record<string, string | number | boolean | Date>;

/* ------------------------------------------------------------------ */
/* Error Code Mapping                                                */
/* ------------------------------------------------------------------ */


/* ------------------------------------------------------------------ */
/* Parameter Sanitization                                            */
/* ------------------------------------------------------------------ */

const NAME_RX = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const DANGEROUS_CHARS = /[;<>\0]/;

/**
 * Validate and sanitise query parameters before they reach ClickHouse.
 * Returns a shallow copy to avoid mutating the original object.
 */
export function sanitizeClickParams(params: Record<string, unknown>): ClickParams {
  const cleaned: ClickParams = {};

  for (const [name, value] of Object.entries(params)) {
    _assertSafeParamName(name);

    // value validation
    if (value == null) {
      cleaned[name] = String(value); // keep null | undefined as string for CH
      continue;
    }

    _assertSafeParamValue(name, value);
    cleaned[name] = value as ClickParams[string];
  }

  return cleaned;
} 

/** Ensures parameter name adheres to ClickHouse-safe identifier rules. */
function _assertSafeParamName(name: string): void {
  if (!NAME_RX.test(name)) {
    throw new ApplicationError({
      message: `Invalid parameter name: ${name}`,
      code: 'CLICKHOUSE_UNSAFE_PARAMETER',
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
    });
  }
}

/** Ensures parameter value is a safe primitive or Date and not containing dangerous chars. */
function _assertSafeParamValue(name: string, value: unknown): void {
  if (
    typeof value === 'string' &&
    (DANGEROUS_CHARS.test(value) || /--|\/\*|\*\/|script>/i.test(value))
  ) {
    throw new ApplicationError({
      message: `Potentially unsafe characters detected in parameter: ${name}`,
      code: 'CLICKHOUSE_UNSAFE_PARAMETER',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }

  if (typeof value === 'string' && value.includes('\0')) {
    throw new ApplicationError({
      message: `Potentially unsafe characters detected in parameter: ${name}`,
      code: 'CLICKHOUSE_UNSAFE_PARAMETER',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }

  if (
    typeof value !== 'string' &&
    typeof value !== 'number' &&
    typeof value !== 'boolean' &&
    !(value instanceof Date)
  ) {
    throw new ApplicationError({
      message: `Potentially unsafe characters detected in parameter: ${name}`,
      code: 'CLICKHOUSE_UNSAFE_PARAMETER',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }
}

