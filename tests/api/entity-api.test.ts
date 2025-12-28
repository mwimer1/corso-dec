import { GET as MainGET } from '@/app/api/v1/entity/[entity]/route';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/entities/pages', () => ({
  getEntityPage: vi.fn().mockResolvedValue({
    data: [
      { id: 1, name: 'Test Project', status: 'active' },
      { id: 2, name: 'Test Company', status: 'pending' }
    ],
    total: 2,
    page: 0,
    pageSize: 10
  })
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({
    userId: 'user_123',
    orgId: 'test-org-123',
    has: vi.fn().mockReturnValue(true)
  })
}));

describe('Entity API Contract Tests', () => {
  describe('/api/v1/entity/[entity] - Main API', () => {
    it('returns flat response shape for main API', async () => {
      const url = new URL('http://localhost:3000/api/v1/entity/projects');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };
      const response = await MainGET(req as any, { params: { entity: 'projects' } });

      expect(response.status).toBe(200);
      const body = await response.json();

      // Response format: { success: true, data: { data, total, page, pageSize } }
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('data');
      expect(body.data).toHaveProperty('data');
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('page');
      expect(body.data).toHaveProperty('pageSize');

      expect(Array.isArray(body.data.data)).toBe(true);
      expect(typeof body.data.total).toBe('number');
      expect(typeof body.data.page).toBe('number');
      expect(typeof body.data.pageSize).toBe('number');

      // Verify data structure
      expect(body.data.data.length).toBeGreaterThan(0);
      expect(body.data.data[0]).toHaveProperty('id');
      expect(body.data.data[0]).toHaveProperty('name');
      expect(body.data.data[0]).toHaveProperty('status');
    });

    it('handles pagination parameters correctly', async () => {
      const url = new URL('http://localhost:3000/api/v1/entity/projects?page=1&pageSize=5');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };
      const response = await MainGET(req as any, { params: { entity: 'projects' } });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data.page).toBe(1);
      expect(body.data.pageSize).toBe(5);
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('handles sorting parameters correctly', async () => {
      const url = new URL('http://localhost:3000/api/v1/entity/projects?sortBy=name&sortDir=desc');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };
      const response = await MainGET(req as any, { params: { entity: 'projects' } });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('data');
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('handles search parameters correctly for projects', async () => {
      const url = new URL('http://localhost:3000/api/v1/entity/projects?search=test');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };
      const response = await MainGET(req as any, { params: { entity: 'projects' } });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('data');
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('handles search parameters correctly for companies', async () => {
      const url = new URL('http://localhost:3000/api/v1/entity/companies?search=test');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };
      const response = await MainGET(req as any, { params: { entity: 'companies' } });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('data');
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('handles search parameters correctly for addresses', async () => {
      const url = new URL('http://localhost:3000/api/v1/entity/addresses?search=test');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };
      const response = await MainGET(req as any, { params: { entity: 'addresses' } });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('data');
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('handles empty search parameter gracefully', async () => {
      const url = new URL('http://localhost:3000/api/v1/entity/projects?search=');
      const req = {
        nextUrl: url,
        url: url.toString(),
      };
      const response = await MainGET(req as any, { params: { entity: 'projects' } });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('data');
      expect(Array.isArray(body.data.data)).toBe(true);
    });

    it('handles filter parameters correctly', async () => {
      const filters = JSON.stringify([{ field: 'status', op: 'eq', value: 'active' }]);
      const url = new URL(`http://localhost:3000/api/v1/entity/projects?filters=${encodeURIComponent(filters)}`);
      const req = {
        nextUrl: url,
        url: url.toString(),
      };
      const response = await MainGET(req as any, { params: { entity: 'projects' } });

      expect(response.status).toBe(200);
      const body = await response.json();

      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('data');
      expect(Array.isArray(body.data.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('handles authentication failures', async () => {
      vi.mocked(await import('@clerk/nextjs/server')).auth.mockResolvedValueOnce({
        userId: null,
        has: vi.fn()
      });

      const req = new Request('http://localhost:3000/api/v1/entity/projects');
      const response = await MainGET(req, { params: { entity: 'projects' } });

      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error.code).toBe('HTTP_401');
    });

    it('handles invalid entities', async () => {
      const req = new Request('http://localhost:3000/api/v1/entity/invalid');
      const response = await MainGET(req, { params: { entity: 'invalid' } });

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error.code).toBe('INVALID_ENTITY');
    });
  });
});

