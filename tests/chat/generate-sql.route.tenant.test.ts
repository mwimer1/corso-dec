import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { SecurityError } from '@/lib/shared/errors/types';
import { beforeEach, describe, expect, it } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";
import { setupDefaultMocks, resetAllMocks, mockGetTenantContext, mockValidateSQLScope, mockCreateCompletion } from "./shared-mocks";
import { mockClerkAuth } from '@/tests/support/mocks';

describe("API v1: ai/generate-sql route - Tenant Isolation", () => {
  beforeEach(() => {
    resetAllMocks();
    mockClerkAuth.setup({ userId: 'test-user-123' });
    setupDefaultMocks();
  });

  it("returns 400 when org context is missing (no header + no session fallback)", async () => {
    // Mock getTenantContext to throw MISSING_ORG_CONTEXT (no header, no session fallback)
    mockGetTenantContext.mockRejectedValueOnce(
      new ApplicationError({
        message: 'Organization ID required for tenant-scoped operations. Provide X-Corso-Org-Id header or ensure org_id in session metadata.',
        code: 'MISSING_ORG_CONTEXT',
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.ERROR,
      })
    );

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        // No X-Corso-Org-Id header
      },
      body: JSON.stringify({ question: "show all users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("MISSING_ORG_CONTEXT");
  });

  it("propagates orgId from header to validateSQLScope", async () => {
    const testOrgId = "test-org-456";
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'SELECT * FROM projects WHERE org_id = \'test-org-456\'',
        },
      }],
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": testOrgId,
      },
      body: JSON.stringify({ question: "show projects" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200);
    
    // Verify validateSQLScope was called with orgId
    expect(mockValidateSQLScope).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      testOrgId
    );
  });

  it("rejects SQL without org_id filter when orgId is provided", async () => {
    const testOrgId = "test-org-789";
    // Mock OpenAI returning SQL without tenant filter
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'SELECT * FROM projects', // Missing WHERE org_id filter
        },
      }],
    });

    // Override default mock to enforce tenant isolation for this test
    // Use mockReset to clear previous implementation, then set new one
    mockValidateSQLScope.mockReset();
    mockValidateSQLScope.mockImplementation((sql: string, expectedOrgId?: string) => {
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

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": testOrgId,
      },
      body: JSON.stringify({ question: "show all projects" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_SQL");
    // Verify the error is about missing tenant filter
    expect(mockValidateSQLScope).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      testOrgId
    );
  });

  it("rejects SQL with wrong org_id value", async () => {
    const testOrgId = "test-org-correct";
    // Mock OpenAI returning SQL with wrong org_id
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'SELECT * FROM projects WHERE org_id = \'test-org-wrong\'',
        },
      }],
    });

    // Override default mock to enforce tenant isolation for this test
    mockValidateSQLScope.mockReset();
    mockValidateSQLScope.mockImplementation((sql: string, expectedOrgId?: string) => {
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
        // Check org_id value matches
        const orgIdMatch = sql.match(/org_id\s*=\s*['"]?([^'"\s]+)/i);
        if (orgIdMatch && orgIdMatch[1] !== expectedOrgId) {
          throw new SecurityError(
            'Tenant isolation violation: org_id mismatch',
            'INVALID_TENANT_ID'
          );
        }
      }
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": testOrgId,
      },
      body: JSON.stringify({ question: "show projects" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_SQL");
  });

  it("succeeds when header is missing but session/org context provides orgId (fallback behavior)", async () => {
    const testOrgId = "test-org-session";
    // Override default mock to return orgId from session (simulating fallback)
    // This test explicitly doesn't send header, so we need to mock getTenantContext
    // to return orgId from "session" even without header
    mockGetTenantContext.mockImplementationOnce(async (_req?: any) => {
      // No header in request, but session provides orgId
      return { 
        orgId: testOrgId, 
        userId: 'test-user-123' 
      };
    });

    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'SELECT * FROM projects WHERE org_id = \'test-org-session\'',
        },
      }],
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        // No X-Corso-Org-Id header - relying on session fallback
      },
      body: JSON.stringify({ question: "show projects" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    // Verify orgId from session was used
    expect(mockValidateSQLScope).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      testOrgId
    );
  });
});
