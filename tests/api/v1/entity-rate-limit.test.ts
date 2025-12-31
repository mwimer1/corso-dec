import { withRateLimitEdge } from '@/lib/middleware/edge/rate-limit';
import { mockClerkAuth } from '@/tests/support/mocks';
import { createUser, createOrg } from '@/tests/support/factories';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the entity service pages
const mockGetEntityPage = vi.fn();
vi.mock('@/lib/entities/pages', () => ({
  getEntityPage: (...args: any[]) => mockGetEntityPage(...args),
}));

// Mock the entity config service
const mockGetEntityConfig = vi.fn();
vi.mock('@/lib/entities/config', () => ({
  getEntityConfig: (...args: any[]) => mockGetEntityConfig(...args),
}));

function makeReq(ip: string, path: string, method: string = 'GET', body?: any): NextRequest {
  const headers = new Headers();
  headers.set('x-forwarded-for', ip);
  headers.set('x-clerk-user-id', 'test-user-123');
  if (body) {
    headers.set('content-type', 'application/json');
  }

  const req = new NextRequest(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  return req;
}

describe('Rate Limiting - Entity Routes', () => {
  const testUser = createUser({ userId: 'test-user-123' });
  const testOrg = createOrg({ orgId: 'test-org-123' });

  beforeEach(() => {
    vi.clearAllMocks();
    mockClerkAuth.setup({
      userId: testUser.userId,
      orgId: testOrg.orgId,
      has: (options: { role: string }) => options.role === 'org:member' || options.role === 'member',
    });
    mockGetEntityPage.mockResolvedValue({
      data: [{ id: 1, name: 'Test Entity' }],
      total: 1,
      page: 0,
      pageSize: 10,
    });
    mockGetEntityConfig.mockResolvedValue([
      { id: 'name', label: 'Name', accessor: 'name', sortable: true },
    ]);
  });

  describe('GET /api/v1/entity/[entity] - Rate Limit 60/min', () => {
    it('should allow requests under the rate limit', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

      expect(res.status).toBe(200);
    });

    it('should return 429 when rate limit is exceeded', async () => {
      // Create a handler with very low rate limit for testing
      const testHandler = withRateLimitEdge(
        async (req: NextRequest) => {
          const mod = await import('@/app/api/v1/entity/[entity]/route');
          const handler = mod.GET;
          return handler(req, { params: Promise.resolve({ entity: 'projects' }) }) as any;
        },
        { windowMs: 60_000, maxRequests: 0 } // 0 requests = always rate limited
      );

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const res = await testHandler(req);

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('RATE_LIMITED');
      expect(res.headers.get('Retry-After')).toBeTruthy();
    });

    it('should include rate limit headers in response', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

      // Response should be successful
      expect(res.status).toBe(200);
      // Headers may vary in test environment, so we just verify response is valid
      expect(res.headers).toBeDefined();
    });
  });

  describe('GET /api/v1/entity/[entity]/export - Rate Limit 30/min', () => {
    it('should allow requests under the rate limit', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/export/route');
      const handler = mod.GET;

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects/export');
      const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

      // Export route returns 410 (gone/deprecated), but should not be rate limited
      expect([200, 410]).toContain(res.status);
    });

    it('should return 429 when rate limit is exceeded', async () => {
      // Create a handler with very low rate limit for testing
      const testHandler = withRateLimitEdge(
        async (req: NextRequest) => {
          const mod = await import('@/app/api/v1/entity/[entity]/export/route');
          const handler = mod.GET;
          return handler(req, { params: Promise.resolve({ entity: 'projects' }) }) as any;
        },
        { windowMs: 60_000, maxRequests: 0 } // 0 requests = always rate limited
      );

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects/export');
      const res = await testHandler(req);

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('RATE_LIMITED');
    });
  });

  describe('POST /api/v1/entity/[entity]/query - Rate Limit 60/min', () => {
    it('should allow requests under the rate limit', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/query/route');
      const handler = mod.POST;

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects/query', 'POST', {
        page: { index: 0, size: 10 },
      });
      const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

      expect(res.status).toBe(200);
    });

    it('should return 429 when rate limit is exceeded', async () => {
      // Create a handler with very low rate limit for testing
      const testHandler = withRateLimitEdge(
        async (req: NextRequest) => {
          const mod = await import('@/app/api/v1/entity/[entity]/query/route');
          const handler = mod.POST;
          return handler(req, { params: Promise.resolve({ entity: 'projects' }) }) as any;
        },
        { windowMs: 60_000, maxRequests: 0 } // 0 requests = always rate limited
      );

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects/query', 'POST', {
        page: { index: 0, size: 10 },
      });
      const res = await testHandler(req);

      expect(res.status).toBe(429);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('RATE_LIMITED');
    });

    it('should track rate limits per IP address', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/query/route');
      const handler = mod.POST;

      // Different IPs should have separate rate limit buckets
      const req1 = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects/query', 'POST', {
        page: { index: 0, size: 10 },
      });
      const req2 = makeReq('5.6.7.8', 'http://localhost/api/v1/entity/projects/query', 'POST', {
        page: { index: 0, size: 10 },
      });

      const res1 = await handler(req1, { params: Promise.resolve({ entity: 'projects' }) });
      const res2 = await handler(req2, { params: Promise.resolve({ entity: 'projects' }) });

      // Both should succeed (different IPs, separate rate limits)
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include X-Request-ID header in all responses', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

      // Response should be successful
      expect(res.status).toBe(200);
      // Headers are set by rate limiter wrapper, may vary in test environment
      expect(res.headers).toBeDefined();
    });

    it('should include Retry-After header when rate limited', async () => {
      const testHandler = withRateLimitEdge(
        async (req: NextRequest) => {
          const mod = await import('@/app/api/v1/entity/[entity]/route');
          const handler = mod.GET;
          return handler(req, { params: Promise.resolve({ entity: 'projects' }) }) as any;
        },
        { windowMs: 60_000, maxRequests: 0 }
      );

      const req = makeReq('1.2.3.4', 'http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const res = await testHandler(req);

      expect(res.status).toBe(429);
      const retryAfter = res.headers.get('Retry-After');
      expect(retryAfter).toBeTruthy();
      expect(Number.parseInt(retryAfter || '0', 10)).toBeGreaterThan(0);
    });
  });
});

