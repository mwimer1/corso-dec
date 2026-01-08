// tests/integrations/database/sql-guard.test.ts
// Sprint 2: Unit tests for SQL Guard AST-based validation
// Sprint 1: Security hardening tests added (S1-T1)

import { describe, expect, it } from 'vitest';
import { guardSQL, SQLGuardError } from '@/lib/integrations/database/sql-guard';

describe('SQL Guard', () => {
  const TEST_ORG_ID = 'test-org-123';

  describe('Basic validation', () => {
    it('rejects empty SQL', () => {
      expect(() => guardSQL('')).toThrow(SQLGuardError);
      expect(() => guardSQL('   ')).toThrow(SQLGuardError);
    });

    it('rejects non-SELECT statements', () => {
      expect(() => guardSQL('UPDATE projects SET name = "test"')).toThrow(SQLGuardError);
      expect(() => guardSQL('DELETE FROM projects')).toThrow(SQLGuardError);
      expect(() => guardSQL('DROP TABLE projects')).toThrow(SQLGuardError);
      expect(() => guardSQL('INSERT INTO projects VALUES (1, "test")')).toThrow(SQLGuardError);
    });

    it('allows SELECT statements', () => {
      expect(() => guardSQL('SELECT * FROM projects', { expectedOrgId: TEST_ORG_ID })).not.toThrow();
    });

    it('allows WITH statements', () => {
      // WITH statements with CTEs should be allowed - CTEs are not validated as tables
      const result = guardSQL('WITH cte AS (SELECT * FROM projects WHERE org_id = ?) SELECT * FROM cte', { expectedOrgId: TEST_ORG_ID });
      expect(result.sql).toBeTruthy();
      // Note: CTEs are allowed, but the underlying table (projects) must be in the allowed list
      expect(result.metadata.tablesUsed).toContain('projects');
    });

    it('rejects multiple statements', () => {
      expect(() => guardSQL('SELECT * FROM projects; SELECT * FROM companies')).toThrow(SQLGuardError);
    });

    it('rejects disallowed tables', () => {
      expect(() => guardSQL('SELECT * FROM users', { expectedOrgId: TEST_ORG_ID })).toThrow(SQLGuardError);
      expect(() => guardSQL('SELECT * FROM system.tables', { expectedOrgId: TEST_ORG_ID })).toThrow(SQLGuardError);
      expect(() => guardSQL('SELECT * FROM information_schema.tables', { expectedOrgId: TEST_ORG_ID })).toThrow(SQLGuardError);
    });

    it('allows allowed tables', () => {
      expect(() => guardSQL('SELECT * FROM projects', { expectedOrgId: TEST_ORG_ID })).not.toThrow();
      expect(() => guardSQL('SELECT * FROM companies', { expectedOrgId: TEST_ORG_ID })).not.toThrow();
      expect(() => guardSQL('SELECT * FROM addresses', { expectedOrgId: TEST_ORG_ID })).not.toThrow();
    });
  });

  describe('Org filter injection', () => {
    it('injects org_id filter when missing', () => {
      const result = guardSQL('SELECT * FROM projects', { expectedOrgId: TEST_ORG_ID });
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql.toLowerCase()).toContain('org_id');
      expect(result.sql).toContain(TEST_ORG_ID);
    });

    it('always injects org_id filter (defense-in-depth)', () => {
      const result = guardSQL(`SELECT * FROM projects WHERE org_id = '${TEST_ORG_ID}'`, { expectedOrgId: TEST_ORG_ID });
      // Should still inject for defense-in-depth
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql.toLowerCase()).toContain('org_id');
    });

    it('injects org_id filter for JOINed tables', () => {
      const result = guardSQL(
        'SELECT * FROM projects p JOIN companies c ON p.company_id = c.id',
        { expectedOrgId: TEST_ORG_ID }
      );
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql.toLowerCase()).toContain('org_id');
    });

    it('handles queries without tables (system queries)', () => {
      const result = guardSQL('SELECT 1', { expectedOrgId: TEST_ORG_ID });
      expect(result.metadata.orgInjected).toBe(false);
      expect(result.sql).toBeTruthy();
    });
  });

  describe('LIMIT enforcement', () => {
    it('adds LIMIT when missing', () => {
      const result = guardSQL('SELECT * FROM projects', { expectedOrgId: TEST_ORG_ID, maxRows: 50 });
      expect(result.metadata.limitApplied).toBe(50);
      expect(result.sql.toLowerCase()).toContain('limit');
    });

    it('clamps LIMIT when exceeds maxRows', () => {
      const result = guardSQL('SELECT * FROM projects LIMIT 1000', { expectedOrgId: TEST_ORG_ID, maxRows: 100 });
      expect(result.metadata.limitApplied).toBe(100);
      expect(result.sql.toLowerCase()).toContain('limit 100');
    });

    it('preserves LIMIT when within maxRows', () => {
      const result = guardSQL('SELECT * FROM projects LIMIT 50', { expectedOrgId: TEST_ORG_ID, maxRows: 100 });
      expect(result.metadata.limitApplied).toBe(50);
    });

    it('uses default maxRows of 100', () => {
      const result = guardSQL('SELECT * FROM projects', { expectedOrgId: TEST_ORG_ID });
      expect(result.metadata.limitApplied).toBe(100);
    });
  });

  describe('Metadata', () => {
    it('returns correct metadata for tables used', () => {
      const result = guardSQL('SELECT * FROM projects', { expectedOrgId: TEST_ORG_ID });
      expect(result.metadata.tablesUsed).toContain('projects');
      expect(result.metadata.tablesUsed.length).toBe(1);
    });

    it('returns multiple tables for JOINs', () => {
      const result = guardSQL(
        'SELECT * FROM projects p JOIN companies c ON p.company_id = c.id',
        { expectedOrgId: TEST_ORG_ID }
      );
      expect(result.metadata.tablesUsed.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SQL normalization', () => {
    it('returns valid SQL string', () => {
      const result = guardSQL('SELECT * FROM projects', { expectedOrgId: TEST_ORG_ID });
      expect(typeof result.sql).toBe('string');
      expect(result.sql.length).toBeGreaterThan(0);
    });

    it('preserves query structure while adding filters', () => {
      const original = 'SELECT id, name FROM projects WHERE status = "active"';
      const result = guardSQL(original, { expectedOrgId: TEST_ORG_ID });
      const sqlLower = result.sql.toLowerCase();
      expect(sqlLower).toContain('select');
      // node-sql-parser uses backticks, so check for backticked table name
      expect(sqlLower).toMatch(/from\s+[`"]?projects[`"]?/);
      expect(sqlLower).toContain('where');
    });
  });
});

describe('SQL Guard - Security Hardening (S1-T1)', () => {
  const TEST_ORG_ID = 'test-org-123';
  const OTHER_ORG_ID = 'other-org-456';

  describe('Tautology bypass prevention', () => {
    it('injects trusted filter for org_id = org_id (tautology)', () => {
      const result = guardSQL('SELECT * FROM projects WHERE org_id = org_id', {
        expectedOrgId: TEST_ORG_ID,
      });
      // Should inject trusted filter regardless of tautology
      expect(result.sql).toContain(TEST_ORG_ID);
      expect(result.metadata.orgInjected).toBe(true);
    });

    it('injects trusted filter for org_id IS NOT NULL (not value-bound)', () => {
      const result = guardSQL('SELECT * FROM projects WHERE org_id IS NOT NULL', {
        expectedOrgId: TEST_ORG_ID,
      });
      // Should inject trusted filter
      expect(result.sql).toContain(TEST_ORG_ID);
      expect(result.metadata.orgInjected).toBe(true);
    });

    it('injects trusted filter for negative filters (org_id != value)', () => {
      const result = guardSQL(`SELECT * FROM projects WHERE org_id != '${OTHER_ORG_ID}'`, {
        expectedOrgId: TEST_ORG_ID,
      });
      // Should inject trusted filter
      expect(result.sql).toContain(TEST_ORG_ID);
      expect(result.metadata.orgInjected).toBe(true);
    });

    it('injects org_id filter for WHERE 1=1 (always true)', () => {
      const result = guardSQL('SELECT * FROM projects WHERE 1=1', {
        expectedOrgId: TEST_ORG_ID,
      });
      // Should inject org_id filter
      expect(result.sql).toContain(TEST_ORG_ID);
      expect(result.metadata.orgInjected).toBe(true);
    });

    it('injects trusted filter for org_id = wrong_value (mismatched org)', () => {
      const result = guardSQL(`SELECT * FROM projects WHERE org_id = '${OTHER_ORG_ID}'`, {
        expectedOrgId: TEST_ORG_ID,
      });
      // Should inject trusted filter regardless
      expect(result.sql).toContain(TEST_ORG_ID);
      expect(result.metadata.orgInjected).toBe(true);
      // The trusted filter should ensure only TEST_ORG_ID data is returned
    });
  });

  describe('Always inject trusted filter (defense-in-depth)', () => {
    it('injects filter even when valid filter exists', () => {
      const result = guardSQL(`SELECT * FROM projects WHERE org_id = '${TEST_ORG_ID}'`, {
        expectedOrgId: TEST_ORG_ID,
      });
      // Should still inject (defense-in-depth)
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql).toContain(TEST_ORG_ID);
    });

    it('injects filter for queries with aliases', () => {
      const result = guardSQL(
        `SELECT * FROM projects p WHERE p.org_id = '${TEST_ORG_ID}'`,
        {
          expectedOrgId: TEST_ORG_ID,
        }
      );
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql).toContain(TEST_ORG_ID);
    });
  });

  describe('Join query org filter enforcement', () => {
    it('injects org filter for all tables in JOIN', () => {
      const result = guardSQL(
        'SELECT * FROM projects p JOIN companies c ON p.company_id = c.id',
        {
          expectedOrgId: TEST_ORG_ID,
        }
      );
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql).toContain(TEST_ORG_ID);
      // Should have filters for both projects and companies
      expect(result.sql.toLowerCase()).toMatch(/org_id/);
    });

    it('handles JOIN with existing filter on one table', () => {
      const result = guardSQL(
        `SELECT * FROM projects p JOIN companies c ON p.company_id = c.id WHERE p.org_id = '${TEST_ORG_ID}'`,
        {
          expectedOrgId: TEST_ORG_ID,
        }
      );
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql).toContain(TEST_ORG_ID);
    });
  });

  describe('Complex bypass attempts', () => {
    it('prevents org_id = org_id OR 1=1 pattern', () => {
      const result = guardSQL(
        `SELECT * FROM projects WHERE org_id = org_id OR 1=1`,
        {
          expectedOrgId: TEST_ORG_ID,
        }
      );
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql).toContain(TEST_ORG_ID);
    });

    it('prevents nested subquery bypass attempts', () => {
      const result = guardSQL(
        `SELECT * FROM projects WHERE id IN (SELECT id FROM projects WHERE org_id = org_id)`,
        {
          expectedOrgId: TEST_ORG_ID,
        }
      );
      expect(result.metadata.orgInjected).toBe(true);
      expect(result.sql).toContain(TEST_ORG_ID);
    });
  });
});
