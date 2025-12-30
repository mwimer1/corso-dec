import { describe, expect, it } from 'vitest';

// Use global test setup mocks (tests/setup/vitest.setup.ts) for monitoring/errors
import { validateAIGeneratedSQL, validateSQLScope, validateSQLSecurity } from '@/lib/integrations/database/scope';

const ORG_ID = 'org_test';

describe('validateAIGeneratedSQL', () => {
  it('rejects multi-statement queries', () => {
    const res = validateAIGeneratedSQL('SELECT 1; SELECT 2');
    expect(res.isValid).toBe(false);
    expect(res.securityIssues[0]).toMatch(/multi-statement/i);
  });

  it('rejects dangerous SQL patterns', () => {
    const res = validateAIGeneratedSQL('DROP TABLE users');
    expect(res.isValid).toBe(false);
    expect(res.securityIssues[0]).toMatch(/DROP statement/i);
  });

  it('rejects SELECT without org filter when orgId provided', () => {
    const res = validateAIGeneratedSQL('SELECT * FROM events', ORG_ID);
    expect(res.isValid).toBe(false);
    expect(res.securityIssues[0]).toMatch(/tenant isolation violation/i);
  });

  it('passes single SELECT with org filter', () => {
    const res = validateAIGeneratedSQL(`SELECT 1 FROM events WHERE org_id = '${ORG_ID}'`, ORG_ID);
    expect(res.isValid).toBe(true);
  });

  it('passes system queries without org filter', () => {
    const res = validateAIGeneratedSQL('SELECT NOW()');
    expect(res.isValid).toBe(true);
  });
});

describe('validateSQLScope', () => {
  it('throws when org filter is missing', () => {
    expect(() => validateSQLScope('SELECT * FROM events', ORG_ID)).toThrow(/tenant isolation violation/i);
  });

  it('passes when correct org filter is present', () => {
    const scoped = `SELECT * FROM events WHERE org_id = '${ORG_ID}'`;
    expect(() => validateSQLScope(scoped, ORG_ID)).not.toThrow();
  });

  it('passes system queries without org filter', () => {
    expect(() => validateSQLScope('SELECT NOW()')).not.toThrow();
  });

  it('rejects dangerous SQL patterns', () => {
    expect(() => validateSQLScope('DROP TABLE users', ORG_ID)).toThrow('DROP statement');
    expect(() => validateSQLScope('INSERT INTO events VALUES (1, 2)', ORG_ID)).toThrow('DML statement');
  });

  it('rejects queries with mismatched org_id', () => {
    const wrongOrgId = 'SELECT * FROM events WHERE org_id = \'org_wrong\'';
    expect(() => validateSQLScope(wrongOrgId, ORG_ID)).toThrow('org_id mismatch');
  });

  it('rejects UNION queries', () => {
    const unionQuery = 'SELECT * FROM events UNION SELECT * FROM other_table';
    expect(() => validateSQLScope(unionQuery, ORG_ID)).toThrow('UNION injection');
  });

  it('accepts WITH statements with org filter', () => {
    const withQuery = `WITH cte AS (SELECT * FROM events WHERE org_id = '${ORG_ID}') SELECT * FROM cte`;
    expect(() => validateSQLScope(withQuery, ORG_ID)).not.toThrow();
  });
});

describe('validateSQLSecurity', () => {
  it('rejects dangerous ClickHouse operations', () => {
    const result = validateSQLSecurity('DROP TABLE users', ORG_ID);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/dangerous SQL operation|suspicious sql patterns detected/i);
  });

  it('rejects system table access', () => {
    const result = validateSQLSecurity('SELECT * FROM system.tables', ORG_ID);
    expect(result.isValid).toBe(false);
    expect(result.reason).toMatch(/system tables not allowed|system table access/i);
  });

  it('accepts safe SELECT queries with org filter', () => {
    const result = validateSQLSecurity(`SELECT * FROM events WHERE org_id = '${ORG_ID}'`, ORG_ID);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedSQL).toBe(`SELECT * FROM events WHERE org_id = '${ORG_ID}'`);
  });
});

describe('SQL Guards: Edge Cases and Bypass Attempts', () => {
  it('rejects SQL comment injection attempts', () => {
    const maliciousQueries = [
      'SELECT * FROM events WHERE org_id = \'test\' -- DROP TABLE users',
      'SELECT * FROM events /* DROP TABLE users */ WHERE org_id = \'test\'',
      'SELECT * FROM events WHERE org_id = \'test\' --',
    ];

    for (const query of maliciousQueries) {
      expect(() => validateSQLScope(query, ORG_ID)).toThrow(/SQL comment|suspicious/i);
    }
  });

  it('rejects attempts to bypass org_id filter with subqueries', () => {
    const bypassAttempts = [
      `SELECT * FROM events WHERE id IN (SELECT id FROM events WHERE org_id != '${ORG_ID}')`,
      `SELECT * FROM events WHERE org_id = '${ORG_ID}' OR 1=1`,
    ];

    for (const query of bypassAttempts) {
      // These should be caught by suspicious pattern detection or org_id validation
      expect(() => validateSQLScope(query, ORG_ID)).toThrow();
    }
  });

  it('rejects complex SQL with nested dangerous operations', () => {
    const complexMalicious = [
      'SELECT * FROM (SELECT * FROM events) AS sub WHERE 1=1; DROP TABLE users',
      'WITH cte AS (SELECT * FROM events) SELECT * FROM cte; DELETE FROM events',
    ];

    for (const query of complexMalicious) {
      expect(() => validateSQLScope(query, ORG_ID)).toThrow();
    }
  });

  it('handles empty or whitespace-only SQL', () => {
    expect(() => validateSQLScope('', ORG_ID)).toThrow(/invalid sql input/i);
    expect(() => validateSQLScope('   ', ORG_ID)).toThrow(/invalid sql input/i);
    expect(() => validateSQLScope('\n\t', ORG_ID)).toThrow(/invalid sql input/i);
  });
});

