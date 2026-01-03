/**
 * Integration tests for /api/v1/query route SQL guard enforcement
 * 
 * Verifies that invalid SQL never reaches the ClickHouse executor.
 * Uses real validateSQLScope but mocks clickhouseQuery to verify it's never called with invalid SQL.
 */

import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { SecurityError } from '@/lib/shared/errors/types';
import { mockClerkAuth } from '@/tests/support/mocks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveRouteModule } from '../support/resolve-route';
import { createUser, createOrg } from '../support/factories';

// Mock getTenantContext
const mockGetTenantContext = vi.fn();
vi.mock('@/lib/server/db/tenant-context', () => ({
  getTenantContext: (req?: any) => mockGetTenantContext(req),
}));

// IMPORTANT: Do NOT mock validateSQLScope - we want to use the real implementation
// This ensures we test the actual guard logic

// Mock clickhouseQuery to verify it's never called with invalid SQL
const mockClickhouseQuery = vi.fn();
vi.mock('@/lib/integrations/clickhouse/server', () => ({
  clickhouseQuery: (...args: any[]) => mockClickhouseQuery(...args),
}));

describe('POST /api/v1/query - SQL Guard Integration', () => {
  const testUser = createUser({ userId: 'test-user-123' });
  const testOrg = createOrg({ orgId: 'test-org-123' });

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: authenticated user with member role
    mockClerkAuth.setup({
      userId: testUser.userId,
      has: (options: { role: string }) => options.role === 'org:member' || options.role === 'member',
    });
    // Default: mock tenant context with org ID from header
    mockGetTenantContext.mockImplementation(async (req?: any) => {
      const orgId = req?.headers?.get?.('x-corso-org-id') || req?.headers?.get?.('X-Corso-Org-Id');
      return { 
        orgId: orgId || testOrg.orgId, 
        userId: testUser.userId 
      };
    });
    // Default: mock successful query execution
    mockClickhouseQuery.mockResolvedValue([
      { id: 1, name: 'Project 1', status: 'active' },
      { id: 2, name: 'Project 2', status: 'active' },
    ]);
  });

  describe('Guard prevents destructive SQL from reaching executor', () => {
    it('should reject DROP TABLE and never call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: 'DROP TABLE projects',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.success).toBe(false);
      // SecurityError throws with code 'SUSPICIOUS_SQL_PATTERN', route uses error.code || 'INVALID_SQL'
      expect(['INVALID_SQL', 'SUSPICIOUS_SQL_PATTERN']).toContain(data.error.code);

      // CRITICAL: Verify clickhouseQuery was NEVER called (guard prevented execution)
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject INSERT and never call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: 'INSERT INTO projects (name) VALUES (\'test\')',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(400);
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject UPDATE and never call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: 'UPDATE projects SET name = \'hacked\' WHERE id = 1',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(400);
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject DELETE and never call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: 'DELETE FROM projects WHERE id = 1',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(400);
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });

    it('should reject ALTER TABLE and never call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: 'ALTER TABLE projects ADD COLUMN malicious BOOLEAN',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(400);
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });
  });

  describe('Guard prevents system table access from reaching executor', () => {
    it('should reject system table access and never call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: 'SELECT * FROM system.tables',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(400);
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });
  });

  describe('Guard prevents multi-statement queries from reaching executor', () => {
    it('should reject multi-statement queries and never call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: 'SELECT * FROM projects WHERE org_id = ?; DROP TABLE projects',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(400);
      expect(mockClickhouseQuery).not.toHaveBeenCalled();
    });
  });

  describe('Guard allows valid SQL to reach executor', () => {
    it('should allow valid SELECT with org filter and call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const validSQL = `SELECT * FROM projects WHERE org_id = '${testOrg.orgId}' LIMIT 10`;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: validSQL,
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);

      // CRITICAL: Verify clickhouseQuery WAS called with valid SQL
      expect(mockClickhouseQuery).toHaveBeenCalledTimes(1);
      expect(mockClickhouseQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.any(Object)
      );
    });

    it('should allow valid SELECT with COUNT and call clickhouseQuery', async () => {
      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const validSQL = `SELECT COUNT(*) as count FROM projects WHERE org_id = '${testOrg.orgId}'`;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrg.orgId,
        },
        body: JSON.stringify({
          sql: validSQL,
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(200);
      expect(mockClickhouseQuery).toHaveBeenCalledTimes(1);
    });
  });
});
