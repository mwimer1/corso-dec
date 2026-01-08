import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the API getEntityPage function since the service now uses that
const mockGetEntityPage = vi.fn();

vi.mock('@/lib/api', () => ({
  getEntityPage: (...args: any[]) => mockGetEntityPage(...args),
}));

// Disable mock DB for this test to ensure we hit the ClickHouse path
process.env.CORSO_USE_MOCK_DB = 'false';

// Mock the ClickHouse integration for the fallback path
const mockQueryEntityData = vi.fn();
const mockQueryEntityCount = vi.fn();

vi.mock('@/lib/integrations/clickhouse/entity-query.server', () => ({
  queryEntityData: (...args: any[]) => mockQueryEntityData(...args),
  queryEntityCount: (...args: any[]) => mockQueryEntityCount(...args),
}));

// Mock the ClickHouse utils
vi.mock('@/lib/integrations/clickhouse/utils', () => ({
  sanitizeClickParams: vi.fn((params) => params),
}));

// Mock the grid config loading
vi.mock('@/lib/services/entity/config', () => ({
  loadGridConfig: vi.fn().mockResolvedValue({
    tableName: 'test_table',
    primaryKey: 'id',
    columns: [
      { accessorKey: 'id' },
      { accessorKey: 'name' },
      { accessorKey: 'status' },
    ],
  }),
}));

describe('Entity Service Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEntityPage.mockResolvedValue({
      data: [
        { id: 1, name: 'Test Project', status: 'active' },
        { id: 2, name: 'Another Project', status: 'inactive' },
      ],
      total: 150,
      page: 0,
      pageSize: 10,
    });
    mockQueryEntityData.mockResolvedValue([
      { id: 1, name: 'Test Project', status: 'active' },
      { id: 2, name: 'Another Project', status: 'inactive' },
    ]);
    mockQueryEntityCount.mockResolvedValue(150);
  });

  describe('fetchEntityData', () => {
    it('should fetch entity data successfully', async () => {
      const { fetchEntityData } = await import('@/lib/services/entity/actions');

      const result = await fetchEntityData('projects', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'name', direction: 'asc' },
        filters: [{ field: 'status', op: 'eq', value: 'active' }],
      });

      expect(result).toEqual({
        data: [
          { id: 1, name: 'Test Project', status: 'active' },
          { id: 2, name: 'Another Project', status: 'inactive' },
        ],
        total: 150,
        page: 0,
        pageSize: 10,
      });

      expect(mockQueryEntityData).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.objectContaining({
          p1: 'active', // sanitized filter parameter
        })
      );

      expect(mockQueryEntityCount).toHaveBeenCalledWith(
        expect.stringContaining('SELECT COUNT(*)'),
        expect.objectContaining({
          p1: 'active',
        })
      );
    });

    it('should handle search parameters', async () => {
      const { fetchEntityData } = await import('@/lib/services/entity/actions');

      await fetchEntityData('companies', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'name', direction: 'asc' },
        search: 'test company',
      });

      expect(mockQueryEntityData).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.objectContaining({
          p1: '%test company%', // search parameter
        })
      );
    });

    it('should handle different filter operators', async () => {
      const { fetchEntityData } = await import('@/lib/services/entity/actions');

      await fetchEntityData('addresses', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'id', direction: 'asc' },
        filters: [
          { field: 'priority', op: 'gt', value: 5 },
          { field: 'tags', op: 'in', value: ['urgent', 'important'] },
        ],
      });

      expect(mockQueryEntityData).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.objectContaining({
          p1: 5,
          p2: ['urgent', 'important'],
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      mockQueryEntityData.mockRejectedValue(new Error('Database connection failed'));

      const { fetchEntityData } = await import('@/lib/services/entity/actions');

      await expect(
        fetchEntityData('projects', undefined, {
          page: 0,
          pageSize: 10,
          sort: { column: 'name', direction: 'asc' },
        })
      ).rejects.toThrow('Failed to fetch entity data');
    });

    it('should handle count query failures gracefully', async () => {
      mockQueryEntityCount.mockRejectedValue(new Error('Count query failed'));

      const { fetchEntityData } = await import('@/lib/services/entity/actions');

      const result = await fetchEntityData('projects', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'name', direction: 'asc' },
      });

      // Should fallback to data length for total
      expect(result.total).toBe(2);
    });
  });
});

