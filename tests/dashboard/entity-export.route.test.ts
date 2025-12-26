import { describe, expect, it, vi } from 'vitest';

// Set mock database environment for tests
process.env.CORSO_USE_MOCK_DB = 'true';

// Mock the auth function
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/auth/authorization/roles', () => ({
  enforceRBAC: vi.fn().mockResolvedValue(undefined),
}));

// Export functionality is implemented directly in the API route

describe('Entity Export Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: 'user_123',
      orgId: 'org_123',
    });
  });

  describe('GET /api/v1/entity/{entity}/export', () => {
    it('should return 410 Gone with deprecation headers (export functionality removed)', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/export/route');
      const handler = mod.GET;

      const req = new Request('http://localhost/api/v1/entity/projects/export?format=csv', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await handler(req as any, { params: { entity: 'projects' } });
      expect(res.status).toBe(410);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('EXPORT_REMOVED');
      expect(body.error.message).toContain('Gone - Export feature no longer available');

      // Check deprecation headers
      expect(res.headers.get('Deprecation')).toBe('true');
      expect(res.headers.get('Sunset')).toBeTruthy();
      expect(res.headers.get('Link')).toContain('/api/v1/entity/{entity}/query');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
        orgId: null,
      });

      const mod = await import('@/app/api/v1/entity/[entity]/export/route');
      const handler = mod.GET;

      const req = new Request('http://localhost/api/v1/entity/projects/export?format=csv', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await handler(req as any, { params: { entity: 'projects' } });
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('HTTP_401');
    });
  });

  describe('OPTIONS /api/v1/entity/{entity}/export', () => {
    it('should handle CORS preflight', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/export/route');
      const handler = mod.OPTIONS;

      const req = new Request('http://localhost/api/v1/entity/projects/export', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      });

      const res = await handler(req as any);
      expect(res.status).toBe(204);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });
});

