import { describe, expect, it, vi } from 'vitest';

// Mock the auth function
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

// Mock the entity service pages (replaces fetchEntityData)
const mockGetEntityPage = vi.fn();
vi.mock('@/lib/services/entity/pages', () => ({
  getEntityPage: (...args: any[]) => mockGetEntityPage(...args),
}));

describe('Entity Query Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      userId: 'test-user-123',
      has: vi.fn().mockReturnValue(true),
    });
    mockGetEntityPage.mockResolvedValue({
      data: [{ id: 1, name: 'Test Entity' }],
      total: 1,
      page: 0,
      pageSize: 10,
    });
  });

  describe('GET /api/v1/entity/{entity}', () => {
    it('should return 200 for valid input', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      // Create NextRequest-like object with URL
      const url = new URL('http://localhost/api/v1/entity/projects?page=0&pageSize=10&sortBy=name&sortDir=asc');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };

      const res = await handler(req as any, { params: { entity: 'projects' } });
      expect(res.status).toBe(200);
      expect(res.headers.get('access-control-allow-origin')).toBeTruthy();

      const body = await res.json();
      // New flat response format
      expect(body).toEqual({
        data: [{ id: 1, name: 'Test Entity' }],
        total: 1,
        page: 0,
        pageSize: 10,
      });

      expect(mockGetEntityPage).toHaveBeenCalledWith(
        'projects',
        {
          page: 0,
          pageSize: 10,
          sort: { column: 'name', direction: 'asc' },
          search: undefined,
          filters: undefined,
        }
      );
    });

    it('should return 400 for invalid entity parameter', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const url = new URL('http://localhost/api/v1/entity/invalid?page=0&pageSize=10');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };

      const res = await handler(req as any, { params: { entity: 'invalid' } });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_ENTITY');
    });

    it('should return 400 for invalid query parameters', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      // Invalid pageSize (too large)
      const url = new URL('http://localhost/api/v1/entity/projects?page=0&pageSize=1000');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };

      const res = await handler(req as any, { params: { entity: 'projects' } });
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_QUERY');
    });

    it('should return 401 for unauthenticated user', async () => {
      mockAuth.mockResolvedValue({
        userId: null,
      });

      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const url = new URL('http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };

      const res = await handler(req as any, { params: { entity: 'projects' } });
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('HTTP_401');
    });

    it('should return 500 for service error', async () => {
      mockGetEntityPage.mockRejectedValue(new Error('Database connection failed'));

      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const url = new URL('http://localhost/api/v1/entity/projects?page=0&pageSize=10');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };

      const res = await handler(req as any, { params: { entity: 'projects' } });
      expect(res.status).toBe(500);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle different entity types', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.GET;

      const testCases = [
        { entity: 'companies', expectedCall: 'companies' },
        { entity: 'addresses', expectedCall: 'addresses' },
        { entity: 'projects', expectedCall: 'projects' },
      ];

      for (const { entity, expectedCall } of testCases) {
        const url = new URL(`http://localhost/api/v1/entity/${entity}?page=0&pageSize=10`);
        const req = {
          nextUrl: url,
          url: url.toString(),
        };

        await handler(req as any, { params: { entity } });

        expect(mockGetEntityPage).toHaveBeenCalledWith(
          expectedCall,
          {
            page: 0,
            pageSize: 10,
            sort: { column: '', direction: 'asc' },
            search: undefined,
            filters: undefined,
          }
        );
      }
    });
  });

  describe('OPTIONS /api/v1/entity/{entity}', () => {
    it('should handle OPTIONS request without throwing', async () => {
      const mod = await import('@/app/api/v1/entity/[entity]/route');
      const handler = mod.OPTIONS;

      const req = new Request('http://localhost/api/v1/entity/projects', {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://example.com' },
      });

      const res = await handler(req as any);
      // OPTIONS handler should not throw and return a valid response
      expect(res).toBeDefined();
      expect(typeof res.status).toBe('number');
    });
  });
});

