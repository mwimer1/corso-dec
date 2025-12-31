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

      const entity = 'projects';
      const req = new Request(`http://localhost/api/v1/entity/${entity}/export?format=csv`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await handler(req as any, { params: { entity } });
      expect(res.status).toBe(410);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('EXPORT_REMOVED');
      expect(body.error.message).toBe('Gone - Export feature no longer available');
      
      // Verify error details structure
      expect(body.error.details).toBeDefined();
      expect(body.error.details.message).toContain('removed during the entity grid migration');
      expect(body.error.details.removedDate).toBe('2025-01-15');
      expect(body.error.details.sunsetDate).toBe('2025-04-15');
      expect(body.error.details.alternativeEndpoint).toBe(`/api/v1/entity/${entity}/query`);

      // Check deprecation headers (RFC 8594)
      expect(res.headers.get('Deprecation')).toBe('true');
      const sunset = res.headers.get('Sunset');
      expect(sunset).toBeTruthy();
      // Sunset header is in RFC 1123 format (e.g., "Tue, 15 Apr 2025 00:00:00 GMT")
      expect(sunset).toMatch(/2025.*Apr.*15|15.*Apr.*2025/); // Verify it contains the date components
      
      // Link header should contain actual entity value, not placeholder
      const linkHeader = res.headers.get('Link');
      expect(linkHeader).toBeTruthy();
      expect(linkHeader).toContain(`/api/v1/entity/${entity}/query`);
      expect(linkHeader).toContain('rel="alternate"');
      expect(linkHeader).toContain('type="application/json"');
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

