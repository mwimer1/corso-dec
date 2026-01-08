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

/**
 * Minimal smoke tests for core API endpoints
 * 
 * These tests verify basic unauthorized behavior (401) and missing org context (403)
 * to ensure contract consistency across endpoints.
 */

describe('API v1: Smoke Tests', () => {
  beforeEach(() => {
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

    it('POST /api/v1/query should return error when missing org context', async () => {
      mockClerkAuth.setup({
        userId: 'test-user-123',
        orgId: null,
        has: () => true, // Has role but no org
      });

      const mod = await import('@/app/api/v1/query/route');
      const handler = mod.POST;

      const req = new Request('http://localhost/api/v1/query', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sql: 'SELECT 1' }),
      });
      (req as any).nextUrl = new URL(req.url);

      const res = await handler(req);
      // Should return error for missing org context (403) or validation error (400)
      expect([400, 401, 403]).toContain(res.status);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      // Accept various error codes for missing org context
      if (res.status !== 400) {
        expect(['HTTP_401', 'MISSING_ORG_CONTEXT', 'NO_ORG_CONTEXT']).toContain(body.error?.code);
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

    it('GET /api/v1/entity/{entity} should return 403 when missing org context', async () => {
      mockClerkAuth.setup({
        userId: 'test-user-123',
        orgId: null,
        has: () => true,
      });
      mockClerkAuth.getClerkClient().users.getOrganizationMembershipList.mockResolvedValue({
        data: [],
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
      // Should return 403 for missing org context
      expect(res.status).toBe(403);

      const body = await res.json();
      expect(body).toHaveProperty('success', false);
      expect(['NO_ORG_CONTEXT', 'FORBIDDEN']).toContain(body.error?.code);
    });
  });

  describe('AI Endpoints', () => {
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
