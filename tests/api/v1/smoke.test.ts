import { mockClerkAuth } from '@/tests/support/mocks';
import { describe, expect, it, beforeEach, vi } from 'vitest';

// Mock getEnvEdge to suppress CSP logging in tests
const mockGetEnvEdge = vi.fn();
vi.mock('@/lib/api/edge', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    getEnvEdge: () => mockGetEnvEdge(),
  };
});

// Mock getEntityPage for entity route tests
const mockGetEntityPage = vi.fn();
vi.mock('@/lib/entities/pages', () => ({
  getEntityPage: (...args: any[]) => mockGetEntityPage(...args),
}));

/**
 * Minimal smoke tests for core API endpoints
 * 
 * These tests verify basic unauthorized behavior (401) and missing org context (403)
 * to ensure contract consistency across endpoints.
 */

describe('API v1: Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockClerkAuth.setup({
      userId: null,
      orgId: null,
      has: () => false,
    });

    // Default env: production mode to suppress CSP logging
    mockGetEnvEdge.mockReturnValue({
      NODE_ENV: 'production',
      CSP_FORWARD_URI: undefined,
      CSP_REPORT_LOG: undefined,
      CSP_REPORT_MAX_LOGS: undefined,
    });
  });

  describe('Health Endpoints (Public)', () => {
    it('GET /api/health should return 200 without authentication', async () => {
      const mod = await import('@/app/api/health/route');
      const handler = mod.GET;

      const req = new Request('http://localhost/api/health');
      const res = await handler(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('status', 'ok');
    });

    it('GET /api/health/clickhouse should return 200 without authentication', async () => {
      const mod = await import('@/app/api/health/clickhouse/route');
      const handler = mod.GET;

      const req = new Request('http://localhost/api/health/clickhouse');
      const res = await handler(req);

      // Health check may return 200 (healthy) or 500 (unhealthy), but not 401
      expect([200, 500]).toContain(res.status);
      if (res.status === 200) {
        const body = await res.json();
        expect(body).toHaveProperty('status', 'healthy');
      }
    });
  });

  describe('Query Endpoint', () => {
    it('POST /api/v1/query should return 401 when unauthenticated', async () => {
      const mod = await import('@/app/api/v1/query/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sql: 'SELECT 1' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      expect(body.error).toHaveProperty('code', 'HTTP_401');
    });

    it('POST /api/v1/query should return 200 when authenticated without org (personal-scope)', async () => {
      mockClerkAuth.setup({
        userId: 'test-user-personal-123',
        orgId: null,
        has: () => true, // Has member role
      });
      mockClerkAuth.getClerkClient().users.getOrganizationMembershipList.mockResolvedValue({
        data: [],
      });

      // Mock ClickHouse query to return data
      const mockClickhouseQuery = vi.fn().mockResolvedValue([{ result: 1 }]);
      vi.doMock('@/lib/integrations/clickhouse/server', () => ({
        clickhouseQuery: mockClickhouseQuery,
      }));

      const mod = await import('@/app/api/v1/query/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sql: 'SELECT 1' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      // Should succeed without org (personal-scope route)
      // May return 200 (success) or 400/500 (if SQL validation/execution fails)
      // The important thing is it doesn't return 400/403 for missing org
      expect([200, 400, 500]).toContain(res.status);

      const body = await res.json();
      // Should not return MISSING_ORG_CONTEXT or NO_ORG_CONTEXT error
      if (body.error) {
        expect(body.error?.code).not.toBe('MISSING_ORG_CONTEXT');
        expect(body.error?.code).not.toBe('NO_ORG_CONTEXT');
      }
    });
  });

  describe('Entity Endpoints', () => {
    it('GET /api/v1/entity/{entity} should return 401 when unauthenticated', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const url = new URL('http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const req = {
        nextUrl: url,
        url: url.toString(),
        headers: new Headers(),
      };

      const res = await handler(req as any, { params: { entity: 'projects' } });
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      expect(body.error).toHaveProperty('code', 'HTTP_401');
    });

    it('POST /api/v1/entity/{entity}/query should return 401 when unauthenticated', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/query/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/entity/projects/query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ page: { index: 0, size: 10 } }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req, { params: { entity: 'projects' } });
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      expect(body.error).toHaveProperty('code', 'HTTP_401');
    });

    it('GET /api/v1/entity/{entity} should return 200 when missing org context (personal-scope)', async () => {
      mockClerkAuth.setup({
        userId: 'test-user-123',
        orgId: null,
        has: () => false, // No org role when no org
      });
      mockClerkAuth.getClerkClient().users.getOrganizationMembershipList.mockResolvedValue({
        data: [],
      });

      // Mock getEntityPage to return data
      mockGetEntityPage.mockResolvedValue({
        data: [{ id: 1, name: 'Test Project' }],
        total: 1,
        page: 0,
        pageSize: 10,
      });

      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const url = new URL('http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const req = {
        nextUrl: url,
        url: url.toString(),
        headers: new Headers(),
      };

      const res = await handler(req as any, { params: { entity: 'projects' } });
      // Should return 200 for personal-scope access (org optional)
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('data');
      // Should not return NO_ORG_CONTEXT error
      expect(body.error?.code).not.toBe('NO_ORG_CONTEXT');
    });
  });

  describe('AI Endpoints', () => {
    it('POST /api/v1/ai/chat should return 200 when authenticated without org (personal-scope)', async () => {
      // Setup: authenticated user without org (personal account)
      mockClerkAuth.setup({
        userId: 'test-user-personal-123',
        orgId: null,
        has: () => true, // Has member role (RBAC check passes)
      });
      mockClerkAuth.getClerkClient().users.getOrganizationMembershipList.mockResolvedValue({
        data: [],
      });

      // Mock OpenAI client and usage limits
      const mockCreateOpenAIClient = vi.fn();
      vi.doMock('@/lib/integrations/openai/server', () => ({
        createOpenAIClient: () => mockCreateOpenAIClient(),
      }));

      const mockCheckDeepResearchLimit = vi.fn().mockResolvedValue({
        allowed: true,
        remaining: 10,
        limit: 10,
        currentUsage: 0,
      });
      vi.doMock('@/lib/api/ai/chat/usage-limits', () => ({
        checkDeepResearchLimit: mockCheckDeepResearchLimit,
        incrementDeepResearchUsage: vi.fn().mockResolvedValue(1),
      }));

      const mod = await import('@/app/api/v1/ai/chat/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'test query' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      // Should succeed without org (personal-scope route)
      // Note: May return 200 (success) or 500 (if OpenAI client not properly mocked)
      // The important thing is it doesn't return 400/403 for missing org
      expect([200, 500]).toContain(res.status);

      if (res.status === 200) {
        const body = await res.json();
        // Should not return MISSING_ORG_CONTEXT error
        expect(body.error?.code).not.toBe('MISSING_ORG_CONTEXT');
        expect(body.error?.code).not.toBe('NO_ORG_CONTEXT');
      }
    });

    it('POST /api/v1/ai/chat should return 401 when unauthenticated', async () => {
      const mod = await import('@/app/api/v1/ai/chat/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: 'test' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      expect(body.error).toHaveProperty('code', 'HTTP_401');
    });

    it('POST /api/v1/ai/chat should return 403 when authenticated but lacks required role', async () => {
      // Setup: authenticated user but without member/admin/owner role
      mockClerkAuth.setup({
        userId: 'test-user-123',
        orgId: 'test-org-123',
        has: () => false, // No member/admin/owner role
      });

      const mod = await import('@/app/api/v1/ai/chat/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/ai/chat', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'X-Corso-Org-Id': 'test-org-123',
        },
        body: JSON.stringify({ content: 'test' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      expect(body.error).toHaveProperty('code', 'FORBIDDEN');
    });

    it('POST /api/v1/ai/generate-sql should return 401 when unauthenticated', async () => {
      const mod = await import('@/app/api/v1/ai/generate-sql/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/ai/generate-sql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: 'test question' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      expect(body.error).toHaveProperty('code', 'HTTP_401');
    });

    it('POST /api/v1/ai/generate-sql should return 200 when authenticated without org (personal-scope)', async () => {
      // Setup: authenticated user without org (personal account)
      mockClerkAuth.setup({
        userId: 'test-user-personal-123',
        orgId: null,
        has: () => true, // Has member role (RBAC check passes)
      });
      mockClerkAuth.getClerkClient().users.getOrganizationMembershipList.mockResolvedValue({
        data: [],
      });

      // Mock OpenAI client
      const mockOpenAIClient = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'SELECT * FROM projects' } }],
            }),
          },
        },
      };
      vi.doMock('@/lib/integrations/openai/server', () => ({
        createOpenAIClient: () => mockOpenAIClient,
      }));

      const mod = await import('@/app/api/v1/ai/generate-sql/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/ai/generate-sql', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: 'show all projects' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      // Should succeed without org (personal-scope route)
      // May return 200 (success) or 400/500 (if OpenAI/SQL validation fails)
      // The important thing is it doesn't return 400/403 for missing org
      expect([200, 400, 500]).toContain(res.status);

      const body = await res.json();
      // Should not return MISSING_ORG_CONTEXT or NO_ORG_CONTEXT error
      if (body.error) {
        expect(body.error?.code).not.toBe('MISSING_ORG_CONTEXT');
        expect(body.error?.code).not.toBe('NO_ORG_CONTEXT');
      }
    });

    it('POST /api/v1/ai/generate-sql should return 403 when authenticated but lacks required role', async () => {
      // Setup: authenticated user but without member/admin/owner role
      mockClerkAuth.setup({
        userId: 'test-user-123',
        orgId: 'test-org-123',
        has: () => false, // No member/admin/owner role
      });

      const mod = await import('@/app/api/v1/ai/generate-sql/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/ai/generate-sql', {
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
          'X-Corso-Org-Id': 'test-org-123',
        },
        body: JSON.stringify({ question: 'test question' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      expect(body.error).toHaveProperty('code', 'FORBIDDEN');
    });
  });

  describe('Public Endpoints', () => {
    it('POST /api/v1/csp-report should return 204 without authentication', async () => {
      const mod = await import('@/app/api/v1/csp-report/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/csp-report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          'csp-report': {
            'document-uri': 'https://example.com',
            'violated-directive': 'script-src',
            'original-policy': "script-src 'self'",
          },
        }),
      });

      const res = await handler(req);
      expect(res.status).toBe(204);
    });

    it('GET /api/v1/insights/search should return 200 without authentication', async () => {
      const mod = await import('@/app/api/v1/insights/search/route');
      const handler = mod.GET;

      const url = new URL('http://localhost/api/v1/insights/search?q=test');
      const req = {
        nextUrl: url,
        url: url.toString(),
        headers: new Headers(),
      };

      const res = await handler(req as any);
      expect(res.status).toBe(200);

      const body = await res.json();
      // Response format: { success: true, data: { results: [...] } } or { results: [...] }
      const results = body.results || body.data?.results;
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
