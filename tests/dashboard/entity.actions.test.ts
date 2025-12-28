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
vi.mock('@/lib/entities/config', () => ({
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
    // Make getEntityPage fail so the code falls through to the real DB path
    // This allows us to test the ClickHouse query path
    mockGetEntityPage.mockRejectedValue(new Error('Mock DB not available'));
    mockQueryEntityData.mockResolvedValue([
      { id: 1, name: 'Test Project', status: 'active' },
      { id: 2, name: 'Another Project', status: 'inactive' },
    ]);
    mockQueryEntityCount.mockResolvedValue(150);
  });

  describe('fetchEntityData', () => {
    it('should fetch entity data successfully', async () => {
      const { fetchEntityData } = await import('@/lib/entities/actions');

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

    it('should handle search parameters for companies with correct fields', async () => {
      const { fetchEntityData } = await import('@/lib/entities/actions');

      await fetchEntityData('companies', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'name', direction: 'asc' },
        search: 'test company',
      });

      // Verify SQL contains OR condition for company_name and company_description
      expect(mockQueryEntityData).toHaveBeenCalledWith(
        expect.stringMatching(/company_name LIKE.*OR.*company_description LIKE/),
        expect.objectContaining({
          p1: '%test company%', // search parameter
        })
      );
    });

    it('should handle search parameters for projects with correct fields', async () => {
      const { fetchEntityData } = await import('@/lib/entities/actions');

      await fetchEntityData('projects', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'id', direction: 'asc' },
        search: 'test project',
      });

      // Verify SQL contains OR condition for description, building_permit_id, and city
      expect(mockQueryEntityData).toHaveBeenCalledWith(
        expect.stringMatching(/description LIKE.*OR.*building_permit_id LIKE.*OR.*city LIKE/),
        expect.objectContaining({
          p1: '%test project%', // search parameter
        })
      );
    });

    it('should handle search parameters for addresses with correct fields', async () => {
      const { fetchEntityData } = await import('@/lib/entities/actions');

      await fetchEntityData('addresses', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'id', direction: 'asc' },
        search: '123 main',
      });

      // Verify SQL contains OR condition for full_address, city, state, and zipcode
      expect(mockQueryEntityData).toHaveBeenCalledWith(
        expect.stringMatching(/full_address LIKE.*OR.*city LIKE.*OR.*state LIKE.*OR.*zipcode LIKE/),
        expect.objectContaining({
          p1: '%123 main%', // search parameter
        })
      );
    });

    it('should ignore search when search query is empty', async () => {
      const { fetchEntityData } = await import('@/lib/entities/actions');

      await fetchEntityData('projects', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'id', direction: 'asc' },
        search: '', // empty search
      });

      // Verify SQL does NOT contain LIKE conditions for search
      expect(mockQueryEntityData).toHaveBeenCalledWith(
        expect.not.stringMatching(/LIKE/),
        expect.not.objectContaining({
          p1: expect.stringContaining('%'),
        })
      );
    });

    it('should ignore search when search query is only whitespace', async () => {
      const { fetchEntityData } = await import('@/lib/entities/actions');

      await fetchEntityData('projects', undefined, {
        page: 0,
        pageSize: 10,
        sort: { column: 'id', direction: 'asc' },
        search: '   ', // whitespace only
      });

      // Verify SQL does NOT contain LIKE conditions for search
      expect(mockQueryEntityData).toHaveBeenCalledWith(
        expect.not.stringMatching(/LIKE/),
        expect.not.objectContaining({
          p1: expect.stringContaining('%'),
        })
      );
    });

    it('should handle different filter operators', async () => {
      const { fetchEntityData } = await import('@/lib/entities/actions');

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
      // Reset the mock to fail so we hit the real DB path
      mockGetEntityPage.mockRejectedValue(new Error('Mock DB not available'));
      mockQueryEntityData.mockRejectedValue(new Error('Database connection failed'));

      const { fetchEntityData } = await import('@/lib/entities/actions');

      await expect(
        fetchEntityData('projects', undefined, {
          page: 0,
          pageSize: 10,
          sort: { column: 'name', direction: 'asc' },
        })
      ).rejects.toThrow('Failed to fetch entity data');
    });

    it('should handle count query failures gracefully', async () => {
      // Reset the mock to fail so we hit the real DB path
      mockGetEntityPage.mockRejectedValue(new Error('Mock DB not available'));
      mockQueryEntityCount.mockRejectedValue(new Error('Count query failed'));

      const { fetchEntityData } = await import('@/lib/entities/actions');

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

