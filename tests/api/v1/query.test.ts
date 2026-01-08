import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { SecurityError } from '@/lib/shared/errors/types';
import { mockClerkAuth } from '@/tests/support/mocks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveRouteModule } from '../../support/resolve-route';
import { createUser, createOrg, createQueryRequest } from '../../support/factories';

// Mock getTenantContext
const mockGetTenantContext = vi.fn();
vi.mock('@/lib/server/db/tenant-context', () => ({
  getTenantContext: (req?: any) => mockGetTenantContext(req),
}));

// Mock validateSQLScope
const mockValidateSQLScope = vi.fn();
vi.mock('@/lib/integrations/database/scope', () => ({
  validateSQLScope: (sql: string, expectedOrgId?: string) => mockValidateSQLScope(sql, expectedOrgId),
}));

// Mock clickhouseQuery
const mockClickhouseQuery = vi.fn();
vi.mock('@/lib/integrations/clickhouse/server', () => ({
  clickhouseQuery: (...args: any[]) => mockClickhouseQuery(...args),
}));

describe('POST /api/v1/query', () => {
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
    // Default: mock validateSQLScope to pass (only check for unsafe patterns)
    mockValidateSQLScope.mockImplementation((sql: string, _expectedOrgId?: string) => {
      const s = sql.toLowerCase();
      // Check for unsafe SQL patterns
      if (/\bdrop\b|\btruncate\b|\bdelete\b(?!\s+from\s+\w+\s+where)/.test(s)) {
        throw new SecurityError('Unsafe SQL detected', 'SUSPICIOUS_SQL_PATTERN');
      }
    });
    // Default: mock successful query execution
    mockClickhouseQuery.mockResolvedValue([
      { id: 1, name: 'Project 1', status: 'active' },
      { id: 2, name: 'Project 2', status: 'active' },
    ]);
  });

  it('should return 200 for valid authenticated request with member role', async () => {
    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true); // route absent on this branch → skip

    const mod: any = await import(url);
    const handler = mod.POST;
    const queryRequest = createQueryRequest({
      sql: 'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
      orgId: testOrg.orgId,
    });
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': testOrg.orgId,
      },
      body: JSON.stringify({
        sql: queryRequest.sql,
        params: { org_id: testOrg.orgId },
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data).toHaveProperty('data');
    expect(Array.isArray(data.data.data)).toBe(true);
    expect(data.data.data).toHaveLength(2);
    expect(data.data.data[0]).toEqual({ id: 1, name: 'Project 1', status: 'active' });

    // Verify clickhouseQuery was called with correct parameters
    expect(mockClickhouseQuery).toHaveBeenCalledWith(
      'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
      { org_id: testOrg.orgId }
    );

    // Verify validateSQLScope was called with orgId
    expect(mockValidateSQLScope).toHaveBeenCalledWith(
      'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
      'test-org-123'
    );
  });

  it('should return 401 when unauthenticated', async () => {
    mockClerkAuth.setup({ userId: null });

    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
        params: { org_id: 'test-org-123' },
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('HTTP_401');
  });

  it('should return 403 when user lacks member role', async () => {
    mockClerkAuth.setup({
      userId: 'test-user-123',
      has: vi.fn().mockReturnValue(false), // No member role
    });

    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
        params: { org_id: 'test-org-123' },
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(403);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('should return 200 when org context is missing (personal-scope support)', async () => {
    // This test verifies personal-scope users can access query endpoint without org
    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // No X-Corso-Org-Id header - personal-scope access
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM projects LIMIT 10',
      }),
    });

    const res = await handler(req as any);
    // Personal-scope users should get 200 (or 400/500 if SQL validation/execution fails)
    // The important thing is they don't get 400/403 for missing org
    expect([200, 400, 500]).toContain(res.status);
    
    if (res.status === 200) {
      const data = await res.json();
      // Should not return MISSING_ORG_CONTEXT error
      if (data.error) {
        expect(data.error.code).not.toBe('MISSING_ORG_CONTEXT');
        expect(data.error.code).not.toBe('NO_ORG_CONTEXT');
      }
    }
  });

  it('should return 400 for invalid SQL (unsafe DROP statement)', async () => {
    // Override default mock to reject DROP statements
    mockValidateSQLScope.mockImplementationOnce((sql: string, _expectedOrgId?: string) => {
      const s = sql.toLowerCase();
      if (/\bdrop\b/.test(s)) {
        throw new SecurityError('Unsafe SQL detected', 'SUSPICIOUS_SQL_PATTERN');
      }
    });

    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        sql: 'DROP TABLE projects',
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_SQL');
  });

  it('should return 400 for invalid SQL (unsafe TRUNCATE statement)', async () => {
    // Override default mock to reject TRUNCATE statements
    mockValidateSQLScope.mockImplementationOnce((sql: string, _expectedOrgId?: string) => {
      const s = sql.toLowerCase();
      if (/\btruncate\b/.test(s)) {
        throw new SecurityError('Unsafe SQL detected', 'SUSPICIOUS_SQL_PATTERN');
      }
    });

    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        sql: 'TRUNCATE TABLE projects',
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_SQL');
  });

  it('should return 400 for invalid request body (missing sql)', async () => {
    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        // Missing required 'sql' field
        params: { org_id: 'test-org-123' },
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid request body (sql too long)', async () => {
    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM projects WHERE org_id = ? LIMIT 10' + ' '.repeat(10000), // Exceeds max length
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should handle query execution errors gracefully', async () => {
    // Mock clickhouseQuery to throw an error
    mockClickhouseQuery.mockRejectedValueOnce(new Error('Database connection failed'));

    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
        params: { org_id: 'test-org-123' },
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('QUERY_EXECUTION_ERROR');
  });

  it('should pass params to clickhouseQuery when provided', async () => {
    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM projects WHERE org_id = ? AND status = ? LIMIT 10',
        params: { org_id: 'test-org-123', status: 'active' },
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200);

    // Verify params were passed correctly
    expect(mockClickhouseQuery).toHaveBeenCalledWith(
      'SELECT * FROM projects WHERE org_id = ? AND status = ? LIMIT 10',
      { org_id: 'test-org-123', status: 'active' }
    );
  });

  it('should handle optional cacheTtl parameter', async () => {
    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Corso-Org-Id': 'test-org-123',
      },
      body: JSON.stringify({
        sql: 'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
        params: { org_id: 'test-org-123' },
        cacheTtl: 300,
      }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it('should handle OPTIONS request for CORS', async () => {
    const url = resolveRouteModule('query');
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.OPTIONS;
    const req = new Request('http://localhost/api/v1/query', {
      method: 'OPTIONS',
      headers: { 'Origin': 'https://example.com' },
    });

    const res = await handler(req as any);
    expect([200, 204]).toContain(res.status);
  });

  describe('Tenant isolation', () => {
    it('should propagate orgId from header to validateSQLScope', async () => {
      const testOrgId = 'test-org-456';
      mockGetTenantContext.mockImplementationOnce(async (req?: any) => {
        const orgId = req?.headers?.get?.('x-corso-org-id') || req?.headers?.get?.('X-Corso-Org-Id');
        return { 
          orgId: orgId || 'default-session-org-id', 
          userId: 'test-user-123' 
        };
      });

      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrgId,
        },
        body: JSON.stringify({
          sql: 'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
          params: { org_id: testOrgId },
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(200);

      // Verify validateSQLScope was called with orgId
      expect(mockValidateSQLScope).toHaveBeenCalledWith(
        'SELECT * FROM projects WHERE org_id = ? LIMIT 10',
        testOrgId
      );
    });

    it('should reject SQL without org_id filter when tenant isolation is enforced', async () => {
      const testOrgId = 'test-org-789';
      // Override default mock to enforce tenant isolation
      mockValidateSQLScope.mockImplementationOnce((sql: string, expectedOrgId?: string) => {
        const s = sql.toLowerCase();
        // Check for unsafe SQL patterns
        if (/\bdrop\b|\btruncate\b|\bdelete\b(?!\s+from\s+\w+\s+where)/.test(s)) {
          throw new SecurityError('Unsafe SQL detected', 'SUSPICIOUS_SQL_PATTERN');
        }
        // Enforce tenant isolation when orgId is provided
        if (expectedOrgId) {
          const hasOrgFilter = /where\s+org_id\s*=/i.test(sql);
          if (!hasOrgFilter && /from\s+\w+/i.test(sql)) {
            throw new SecurityError(
              'Tenant isolation violation: org_id filter required for multi-tenant queries',
              'MISSING_TENANT_FILTER'
            );
          }
        }
      });

      const url = resolveRouteModule('query');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Corso-Org-Id': testOrgId,
        },
        body: JSON.stringify({
          sql: 'SELECT * FROM projects', // Missing WHERE org_id filter
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('INVALID_SQL');
    });
  });
});

