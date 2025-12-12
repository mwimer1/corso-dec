// lib/integrations/clickhouse/security.ts
/* ---------------------------------------------------------------------------
 * ClickHouse security utilities and legacy error code mapping
 * ------------------------------------------------------------------------ */

import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';

/**
 * Maps new generic ClickHouse errors back to legacy error codes expected by tests
 * This maintains backward compatibility while the test suite is being migrated
 */
export function mapClickhouseError(err: unknown, sql?: string): ApplicationError {
  void sql;
  if (err instanceof ApplicationError) {
    // Map specific ApplicationError codes to legacy codes
    switch (err.code) {
      case 'CLICKHOUSE_DANGEROUS_OPERATION':
        return err; // Already has the correct code

      case 'CLICKHOUSE_INVALID_OPERATION':
        return err; // Already has the correct code

      default:
        // For other ApplicationErrors, keep the original
        return err;
    }
  }

  // Handle regular Error objects and strings
  const msg = err instanceof Error ? err.message : String(err);
  const lowerMsg = msg.toLowerCase();

  // Map specific error messages to legacy codes
  if (
    lowerMsg.includes('missing tenant') ||
    msg === 'authorization'
  ) {
    return new ApplicationError({
      code: 'MISSING_TENANT_FILTER',
      message: msg || 'Missing tenant filter',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }

  if (
    lowerMsg.includes('access to system tables not allowed') ||
    lowerMsg.includes('information_schema') ||
    lowerMsg.includes('system.')
  ) {
    return new ApplicationError({
      code: 'CLICKHOUSE_DANGEROUS_OPERATION',
      message: 'Access to system tables not allowed',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }

  if (
    lowerMsg.includes('suspicious sql patterns') ||
    lowerMsg.includes('always true condition') ||
    lowerMsg.includes('always-true condition') ||
    lowerMsg.includes('union injection') ||
    lowerMsg.includes('potentially dangerous operation') ||
    /\b(drop|insert|delete|update|truncate|alter)\b/i.test(msg)
  ) {
    return new ApplicationError({
      code: 'CLICKHOUSE_DANGEROUS_OPERATION',
      message: msg,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }

  if (
    lowerMsg.includes('non-select query') ||
    lowerMsg.includes('invalid operation') ||
    /\b(describe|show|explain|with)\b/i.test(msg)
  ) {
    return new ApplicationError({
      code: 'CLICKHOUSE_INVALID_OPERATION',
      message: msg,
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.ERROR,
    });
  }

  if (
    lowerMsg.includes('invalid tenant filter')
  ) {
    return new ApplicationError({
      code: 'INVALID_TENANT_FILTER',
      message: msg,
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.CRITICAL,
    });
  }

  // Default fallback to generic error
  return new ApplicationError({
    code: 'CLICKHOUSE_QUERY_ERROR',
    message: msg || 'ClickHouse query failed',
    category: ErrorCategory.DATABASE,
    severity: ErrorSeverity.ERROR,
    ...(err instanceof Error ? { originalError: err } : {}),
  });
} 

// Org-specific missing tenant filter function removed

