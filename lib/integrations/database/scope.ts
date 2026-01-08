// lib/integrations/database/scope.ts
/**
 * SQL scope helpers for tenant isolation and security.
 * Used by ClickHouse, OpenAI, and any other integration requiring SQL validation.
 *
 * @last_updated 2025-07-27
 * @owner core-team@corso
 */
import { logger } from '@/lib/monitoring';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';

/**
 * Security error for SQL scope violations
 */
class SecurityError extends ApplicationError {
  constructor(
    message: string,
    code: string = 'SQL_SCOPE_VIOLATION',
    category: ErrorCategory = ErrorCategory.AUTHORIZATION,
    severity: ErrorSeverity = ErrorSeverity.CRITICAL,
  ) {
    super({ message, code, category, severity });
    this.name = 'SecurityError';
  }
}

/* -------------------------------------------------------------------------- */
/*                             Constants & Regex                              */
/* -------------------------------------------------------------------------- */
const SQL_COMMENT_REGEX = /(--|\/\*).*?(\*\/)?/gs;
const ALWAYS_TRUE_REGEX = /\b1\s*=\s*1\b/i;
const UNION_REGEX = /\bUNION\s+(ALL|SELECT)?\b/i;

const DANGEROUS_SQL_PATTERNS = [
  { re: /\bDROP\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW)\b/i, name: 'DROP statement' },
  { re: /\b(INSERT|UPDATE|DELETE)\s+/i, name: 'DML statement' },
  { re: /\bTRUNCATE\s+/i, name: 'TRUNCATE statement' },
  { re: /\bALTER\s+(TABLE|DATABASE|SCHEMA)\b/i, name: 'ALTER statement' },
  { re: /\bCREATE\s+(TABLE|DATABASE|SCHEMA|INDEX|VIEW)\b/i, name: 'CREATE statement' },
  { re: /\bGRANT\b/i, name: 'GRANT statement' },
  { re: /\bREVOKE\b/i, name: 'REVOKE statement' },
  { re: /\bEXEC(UTE)?\b/i, name: 'EXECUTE statement' },
  { re: /\binformation_schema\b|\bsystem\./i, name: 'System table access' },
];

// Removed: INVALID_TENANT_PATTERNS (unused)

/* -------------------------------------------------------------------------- */
/*                             🔎 Lightweight Parser                          */
/* -------------------------------------------------------------------------- */

interface ParsedSQL {
  detectedTables: string[];
  hasWhereClause: boolean;
  suspiciousPatterns: string[];
}

const parseSQL = (sql: string): ParsedSQL => {
  const norm = sql.toLowerCase().trim();

  const tables: string[] = [];
  const grab = (re: RegExp) => {
    let m: RegExpExecArray | null;
    while ((m = re.exec(norm))) {
      const tbl = m?.[1];
      if (tbl) tables.push(tbl);
    }
  };

  grab(/\b(?:from|join)\s+([a-z_][\w.]*)/gi);
  grab(/\bupdate\s+([a-z_][\w.]*)/gi);
  grab(/\binsert\s+into\s+([a-z_][\w.]*)/gi);

  const hasWhere = /\bwhere\b/i.test(norm);

  const suspiciousRules = [
    ...DANGEROUS_SQL_PATTERNS,
    { re: ALWAYS_TRUE_REGEX, name: 'Always-true condition' },
    { re: UNION_REGEX, name: 'UNION injection' },
    { re: SQL_COMMENT_REGEX, name: 'SQL comment' },
  ];

  const suspiciousPatterns = suspiciousRules
    .filter(({ re }) => re.test(norm))
    .map(({ name }) => name);

  return {
    detectedTables: [...new Set(tables)],
    hasWhereClause: hasWhere,
    suspiciousPatterns: [...new Set(suspiciousPatterns)],
  };
};

/**
 * Validates SQL queries for tenant isolation and security compliance.
 * This is the primary SQL security guard for the entire application.
 *
 * @param sql The SQL query to validate.
 * @param expectedOrgId Optional organization ID to validate against literal values.
 *
 * @throws {SecurityError} When SQL is empty, contains dangerous patterns,
 * or violates tenant isolation rules.
 */
export function validateSQLScope(sql: string, expectedOrgId?: string): void {
  if (!sql?.trim()) {
    throw new SecurityError('Invalid SQL input', 'INVALID_SQL_INPUT');
  }

  const parsed = parseSQL(sql);
  logger?.debug?.('[SQLScopeGuard] analysis', parsed);

  if (parsed.suspiciousPatterns.length) {
    throw new SecurityError(
      `Suspicious SQL patterns detected: ${parsed.suspiciousPatterns.join(', ')}`,
      'SUSPICIOUS_SQL_PATTERN',
    );
  }

  // Allow system queries that don't access tables
  const isSystemQuery = /^(SELECT\s+(NOW|CURRENT_TIMESTAMP|CURRENT_DATE|VERSION)\s*\(\s*\)|SHOW\s+VARIABLES|DESCRIBE\s+)/i.test(sql.trim());
  if (isSystemQuery && !parsed.detectedTables.length) {
    return;
  }

  if (!/^(SELECT|WITH)\s+/i.test(sql.trim())) {
     throw new SecurityError('Only SELECT or WITH queries are allowed', 'INVALID_QUERY_TYPE');
  }

  // CRITICAL SECURITY: Enforce tenant isolation when expectedOrgId is provided
  // This ensures multi-tenant data isolation: no query runs without proper org_id filtering
  // See docs/security/README.md for tenant isolation guarantees and implementation details
  if (expectedOrgId && parsed.detectedTables.length > 0) {
    const hasOrgFilter = /where\s+org_id\s*=/i.test(sql);

    if (!hasOrgFilter) {
      throw new SecurityError(
        'Tenant isolation violation: org_id filter required for multi-tenant queries',
        'MISSING_TENANT_FILTER',
        ErrorCategory.AUTHORIZATION,
        ErrorSeverity.CRITICAL,
      );
    }

    // Additional security: check that the org_id value matches expected
    const orgIdMatch = sql.match(/org_id\s*=\s*['"]?([^'"\s]+)/i);
    if (orgIdMatch && orgIdMatch[1] !== expectedOrgId) {
      throw new SecurityError(
        'Tenant isolation violation: org_id mismatch',
        'INVALID_TENANT_ID',
        ErrorCategory.AUTHORIZATION,
        ErrorSeverity.CRITICAL,
      );
    }
  }

  logger?.info?.('[SQLScopeGuard] validation passed', { tables: parsed.detectedTables.length });
}

/**
 * Validates SQL generated by AI, returning a structured result instead of throwing.
 *
 * @param sql The AI-generated SQL query.
 * @param orgId Optional organization ID to validate against.
 * @returns An object indicating validity, the sanitized SQL, and any security issues.
 */
export function validateAIGeneratedSQL(
  sql: string,
  orgId?: string,
): { isValid: boolean; sanitizedSQL: string; securityIssues: string[] } {
  const trimmed = sql.trim();

  // Block multi-statement queries. Allow a single optional trailing semicolon.
  const withoutTrailing = trimmed.endsWith(';') ? trimmed.slice(0, -1) : trimmed;
  if (withoutTrailing.includes(';')) {
    return {
      isValid: false,
      sanitizedSQL: '',
      securityIssues: ['Multi-statement queries are not allowed'],
    };
  }

  try {
    // Pass optional orgId through so AI-generated SQL can be validated with tenant isolation
    validateSQLScope(withoutTrailing, orgId);
    return { isValid: true, sanitizedSQL: withoutTrailing, securityIssues: [] };
  } catch (error) {
    const securityIssues = error instanceof Error ? [error.message] : ['Unknown validation error'];
    return { isValid: false, sanitizedSQL: '', securityIssues };
  }
}

// injectOrgScope function removed - orgs no longer supported

// findInsertPointForWhere function removed - no longer needed without injectOrgScope

/**
 * Validates SQL for ClickHouse-specific requirements and tenant isolation.
 * Returns an object with isValid, reason, and sanitizedSQL.
 */
export function validateSQLSecurity(
  sql: string,
  expectedOrgId?: string,
): { isValid: boolean; reason?: string; sanitizedSQL?: string } {
  if (!sql || typeof sql !== 'string') {
    return { isValid: false, reason: 'SQL query is required' };
  }

  try {
    // Use core SQL validation with tenant isolation enforcement
    validateSQLScope(sql, expectedOrgId);

    // ClickHouse-specific validations
    const lowerSql = sql.toLowerCase().trim();

    // Block system table access
    if (lowerSql.includes('system.') || lowerSql.includes('information_schema')) {
      return {
        isValid: false,
        reason: 'Access to system tables not allowed',
      };
    }

    // Only allow SELECT operations
    if (!lowerSql.startsWith('select')) {
      return {
        isValid: false,
        reason: 'Only SELECT queries are allowed in ClickHouse',
      };
    }

    // Block dangerous operations
    const dangerousPatterns = [
      /\b(drop|insert|delete|update|truncate|alter|create)\b/i,
      /;\s*(drop|delete|insert|update)/i,
      /--\s*drop/i,
      /\/\*.*drop.*\*\//i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        return {
          isValid: false,
          reason: 'Potentially dangerous SQL operation detected',
        };
      }
    }

    return { isValid: true, sanitizedSQL: sql };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      isValid: false,
      reason: `SQL validation failed: ${message}`,
    };
  }
}


