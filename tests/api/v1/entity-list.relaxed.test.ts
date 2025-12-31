import { mockClerkAuth } from '@/tests/support/mocks';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the entity service pages - will return mock DB data when CORSO_USE_MOCK_DB=true
const mockGetEntityPage = vi.fn();
vi.mock('@/lib/entities/pages', () => ({
  getEntityPage: (...args: any[]) => mockGetEntityPage(...args),
}));

// Mock the entity config service
const mockGetEntityConfig = vi.fn();
vi.mock('@/lib/entities/config', () => ({
  getEntityConfig: (...args: any[]) => mockGetEntityConfig(...args),
}));

// Mock auth mode helper
const mockIsRelaxedAuthMode = vi.fn();
vi.mock('@/lib/shared/config/auth-mode', () => ({
  isRelaxedAuthMode: () => mockIsRelaxedAuthMode(),
}));

describe('GET /api/v1/entity/[entity] - Relaxed Auth + Mock DB', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up relaxed auth mode
    process.env.NEXT_PUBLIC_AUTH_MODE = 'relaxed';
    process.env.ALLOW_RELAXED_AUTH = 'true';
    process.env.CORSO_USE_MOCK_DB = 'true';
    mockIsRelaxedAuthMode.mockReturnValue(true);
    
    // Mock auth to return userId (no org required in relaxed mode)
    mockClerkAuth.setup({
      userId: 'test-user-relaxed-123',
      orgId: null, // No org in relaxed mode
      has: vi.fn().mockReturnValue(false), // No RBAC in relaxed mode
    });
    
    // Mock entity page data (simulating mock DB response)
    mockGetEntityPage.mockResolvedValue({
      data: [
        { id: '1', name: 'Project Alpha', status: 'active', created_at: '2024-01-01' },
        { id: '2', name: 'Project Beta', status: 'active', created_at: '2024-01-02' },
        { id: '3', name: 'Project Gamma', status: 'pending', created_at: '2024-01-03' },
      ],
      total: 3,
      page: 0,
      pageSize: 50,
    });
    
    // Mock entity config (column definitions)
    mockGetEntityConfig.mockResolvedValue([
      { id: 'name', label: 'Name', accessor: 'name', sortable: true },
      { id: 'status', label: 'Status', accessor: 'status', sortable: true },
      { id: 'created_at', label: 'Created', accessor: 'created_at', sortable: true },
    ]);
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_AUTH_MODE;
    delete process.env.ALLOW_RELAXED_AUTH;
    delete process.env.CORSO_USE_MOCK_DB;
  });

  function makeReq(path: string): NextRequest {
    const url = new URL(path, 'http://localhost');
    return new NextRequest(url, {
      method: 'GET',
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
    });
  }

  it('should return 200 with data for valid request in relaxed mode', async () => {
    const mod = await import('@/app/api/v1/entity/[entity]/route');
    const handler = mod.GET;

    const req = makeReq('http://localhost/api/v1/entity/projects?page=0&pageSize=50');
    const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('data');
    expect(body.data).toHaveProperty('total');
    expect(Array.isArray(body.data.data)).toBe(true);
    expect(body.data.data.length).toBeGreaterThan(0);
    expect(typeof body.data.total).toBe('number');
    expect(body.data.total).toBe(3);
  });

  it('should ignore invalid sortBy field and still return rows', async () => {
    const mod = await import('@/app/api/v1/entity/[entity]/route');
    const handler = mod.GET;

    const req = makeReq('http://localhost/api/v1/entity/projects?page=0&pageSize=50&sortBy=not_a_field&sortDir=desc');
    const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.data.length).toBeGreaterThan(0);
    // Invalid sortBy should be ignored, so data should still be returned
    expect(body.data.total).toBe(3);
  });

  it('should drop invalid filter field and still return rows', async () => {
    const mod = await import('@/app/api/v1/entity/[entity]/route');
    const handler = mod.GET;

    const invalidFilter = JSON.stringify([{ field: 'not_a_field', op: 'eq', value: 'x' }]);
    const req = makeReq(`http://localhost/api/v1/entity/projects?page=0&pageSize=50&filters=${encodeURIComponent(invalidFilter)}`);
    const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.data.length).toBeGreaterThan(0);
    // Invalid filter should be dropped, so data should still be returned
    expect(body.data.total).toBe(3);
  });

  it('should return 400 for invalid filters format (not an array)', async () => {
    const mod = await import('@/app/api/v1/entity/[entity]/route');
    const handler = mod.GET;

    const invalidFilter = JSON.stringify({ bad: 'format' });
    const req = makeReq(`http://localhost/api/v1/entity/projects?page=0&pageSize=50&filters=${encodeURIComponent(invalidFilter)}`);
    const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_FILTERS');
  });

  it('should work without orgId in relaxed mode', async () => {
    // Ensure no orgId is provided
    mockClerkAuth.setup({
      userId: 'test-user-relaxed-123',
      orgId: null,
      has: vi.fn().mockReturnValue(false),
    });

    const mod = await import('@/app/api/v1/entity/[entity]/route');
    const handler = mod.GET;

    const req = makeReq('http://localhost/api/v1/entity/projects?page=0&pageSize=50');
    const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

    // Should still work in relaxed mode without orgId
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.data.length).toBeGreaterThan(0);
  });

  it('should handle valid filters correctly', async () => {
    const mod = await import('@/app/api/v1/entity/[entity]/route');
    const handler = mod.GET;

    const validFilter = JSON.stringify([{ field: 'status', op: 'eq', value: 'active' }]);
    const req = makeReq(`http://localhost/api/v1/entity/projects?page=0&pageSize=50&filters=${encodeURIComponent(validFilter)}`);
    const res = await handler(req, { params: Promise.resolve({ entity: 'projects' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    
    // Verify getEntityPage was called with the valid filter
    expect(mockGetEntityPage).toHaveBeenCalledWith(
      'projects',
      expect.objectContaining({
        filters: expect.arrayContaining([
          expect.objectContaining({ field: 'status', op: 'eq', value: 'active' }),
        ]),
      })
    );
  });
});

