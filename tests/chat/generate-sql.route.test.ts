import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { SecurityError } from '@/lib/shared/errors/types';
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveRouteModule } from "../support/resolve-route";

// Mock the auth function
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock OpenAI client
const mockCreateCompletion = vi.fn();
vi.mock('@/lib/integrations/openai/server', () => ({
  createOpenAIClient: () => ({
    chat: {
      completions: {
        create: mockCreateCompletion,
      },
    },
  }),
}));

// Mock getTenantContext
const mockGetTenantContext = vi.fn();
vi.mock('@/lib/server/db/tenant-context', () => ({
  getTenantContext: (req?: any) => mockGetTenantContext(req),
}));

// Mock validateSQLScope - enhanced to support tenant isolation
const mockValidateSQLScope = vi.fn();
vi.mock('@/lib/integrations/database/scope', () => ({
  validateSQLScope: (sql: string, expectedOrgId?: string) => mockValidateSQLScope(sql, expectedOrgId),
}));

// Mock getEnv - route uses OPENAI_SQL_MODEL
vi.mock('@/lib/server/env', () => ({
  getEnv: () => ({
    OPENAI_SQL_MODEL: 'gpt-4o-mini',
    // Add other env vars if route usage expands
  }),
}));

describe("API v1: ai/generate-sql route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
    });
    // Default: mock tenant context with org ID from header
    // For tests that don't explicitly set a header, we'll provide a default orgId from "session"
    // This simulates the fallback behavior where session metadata provides orgId
    mockGetTenantContext.mockImplementation(async (req?: any) => {
      const orgId = req?.headers?.get?.('x-corso-org-id') || req?.headers?.get?.('X-Corso-Org-Id');
      // If no header, simulate session fallback by returning a default orgId
      // Tests that want to test MISSING_ORG_CONTEXT should explicitly mock rejection
      return { 
        orgId: orgId || 'default-session-org-id', 
        userId: 'test-user-123' 
      };
    });
    // Default: mock validateSQLScope to pass (only check for unsafe patterns, not tenant isolation)
    // Tenant isolation is tested explicitly in dedicated tests
    mockValidateSQLScope.mockImplementation((sql: string, _expectedOrgId?: string) => {
      const s = sql.toLowerCase();
      // Check for unsafe SQL patterns
      if (/\bdrop\b|\btruncate\b|\bdelete\b(?!\s+from\s+\w+\s+where)/.test(s)) {
        throw new SecurityError('Unsafe SQL detected', 'SUSPICIOUS_SQL_PATTERN');
      }
      // Note: Tenant isolation enforcement is tested explicitly in dedicated tests below
      // The default mock doesn't enforce it to allow basic tests to pass
    });
    // Mock successful OpenAI response
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        message: {
          content: 'SELECT * FROM users',
        },
      }],
    });
  });

  it("loads route module and returns a Response", async () => {
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true); // route absent on this branch → skip

    const mod: any = await import(url);
    const handler = mod.POST ?? mod.GET;
    expect(typeof handler).toBe("function");
    const method = handler === mod.POST ? "POST" : "GET";
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method,
      headers: {
        "content-type": "application/json",
        "Origin": "https://example.com",
        "X-Corso-Org-Id": "test-org-123"
      },
      body: method === "POST" ? JSON.stringify({ question: "show all users" }) : undefined,
    });
    const res = await handler(req as any);
    expect(typeof res.status).toBe('number');
  }, 20_000);

  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: "show all users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("HTTP_401");
  });

  it("returns 200 for safe SQL queries", async () => {
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'SELECT * FROM users',
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
        "X-Corso-Org-Id": "test-org-123"
      },
      body: JSON.stringify({ question: "show all users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty("sql");
    expect(data.data.sql).toBe("SELECT * FROM users");
  });

  it("returns 400 for missing required field", async () => {
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123"
      },
      body: JSON.stringify({}),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("accepts sql, prompt, query, or question fields", async () => {
    mockCreateCompletion.mockResolvedValue({
      choices: [{
        message: {
          content: 'SELECT * FROM users',
        },
      }],
    });

    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.POST;

    // Test with 'sql' field
    const req1 = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123"
      },
      body: JSON.stringify({ sql: "SELECT * FROM users" }),
    });
    const res1 = await handler(req1 as any);
    expect(res1.status).toBe(200);

    // Test with 'prompt' field
    const req2 = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "POST",
      headers: { 
        "content-type": "application/json",
        "X-Corso-Org-Id": "test-org-123"
      },
      body: JSON.stringify({ prompt: "show me users" }),
    });
    const res2 = await handler(req2 as any);
    expect(res2.status).toBe(200);
  });

  it("returns 400 for unsafe SQL queries (DROP)", async () => {
    // Mock OpenAI returning unsafe SQL
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'DROP TABLE users',
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
        "X-Corso-Org-Id": "test-org-123"
      },
      body: JSON.stringify({ question: "drop all tables" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_SQL");
  });

  it("returns 400 for unsafe SQL queries (TRUNCATE)", async () => {
    // Mock OpenAI returning unsafe SQL
    mockCreateCompletion.mockResolvedValueOnce({
      choices: [{
        message: {
          content: 'TRUNCATE TABLE users',
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
        "X-Corso-Org-Id": "test-org-123"
      },
      body: JSON.stringify({ sql: "TRUNCATE TABLE users" }),
    });

    const res = await handler(req as any);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INVALID_SQL");
  });

  it("handles OPTIONS request for CORS", async () => {
    const url = resolveRouteModule("ai/generate-sql");
    if (!url) return expect(true).toBe(true);

    const mod: any = await import(url);
    const handler = mod.OPTIONS;
    const req = new Request("http://localhost/api/v1/ai/generate-sql", {
      method: "OPTIONS",
      headers: { "Origin": "https://example.com" },
    });

    const res = await handler(req as any);
    expect([200, 204]).toContain(res.status);
  });

  describe("Tenant isolation", () => {
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

  describe("RBAC / Authentication", () => {
    it("allows authenticated users to access endpoint (no role restrictions in handler)", async () => {
      // Note: The handler only checks for userId, not specific roles.
      // OpenAPI spec indicates [member, viewer] are allowed, but handler doesn't enforce roles.
      // This test verifies the actual behavior: any authenticated user can access.
      mockAuth.mockResolvedValue({
        userId: 'test-user-any-role',
      });

      const url = resolveRouteModule("ai/generate-sql");
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request("http://localhost/api/v1/ai/generate-sql", {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "X-Corso-Org-Id": "test-org-123",
        },
        body: JSON.stringify({ question: "show users" }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("denies unauthenticated users (401)", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const url = resolveRouteModule("ai/generate-sql");
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request("http://localhost/api/v1/ai/generate-sql", {
        method: "POST",
        headers: { 
          "content-type": "application/json",
          "X-Corso-Org-Id": "test-org-123",
        },
        body: JSON.stringify({ question: "show users" }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("HTTP_401");
    });

    // Note: Role-based access control (RBAC) is not enforced in the handler code.
    // The OpenAPI spec indicates x-corso-rbac: [member, viewer], but the handler
    // only checks for authentication (userId), not specific roles.
    // If RBAC enforcement is added in the future, additional tests should verify:
    // - Viewer role → 200 (if allowed) or 403 (if denied)
    // - Member role → 200
    // - Admin role → 200 (if allowed) or 403 (if denied)
  });
});

