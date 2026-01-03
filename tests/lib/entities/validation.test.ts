import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  parseFiltersParam,
  getAllowedSortFields,
  getAllowedFilterFields,
  validateSortBy,
  validateFilters,
  validateEntityQueryParams,
} from '@/lib/entities/validation';
import * as configModule from '@/lib/entities/config';

// Mock getEntityConfig
vi.mock('@/lib/entities/config', () => ({
  getEntityConfig: vi.fn(),
}));

describe('lib/entities/validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseFiltersParam', () => {
    it('should return undefined for null input', () => {
      expect(parseFiltersParam(null)).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      expect(parseFiltersParam('')).toBeUndefined();
    });

    it('should parse valid filters JSON array', () => {
      const filters = [
        { field: 'status', op: 'eq', value: 'active' },
        { field: 'priority', op: 'gt', value: 5 },
      ];
      const result = parseFiltersParam(JSON.stringify(filters));
      expect(result).toEqual(filters);
    });

    it('should handle URL-encoded filters', () => {
      const filters = [{ field: 'status', op: 'eq', value: 'active' }];
      const encoded = encodeURIComponent(JSON.stringify(filters));
      const result = parseFiltersParam(encoded);
      expect(result).toEqual(filters);
    });

    it('should filter out invalid filter entries', () => {
      const invalidFilters = [
        { field: '', op: 'eq', value: 'active' }, // Empty field
        { field: 'status', op: 'invalid', value: 'active' }, // Invalid op
        { field: 'status', op: 'eq' }, // Missing value
        { field: 'status', op: 'eq', value: 'active' }, // Valid
      ];
      const result = parseFiltersParam(JSON.stringify(invalidFilters));
      expect(result).toEqual([{ field: 'status', op: 'eq', value: 'active' }]);
    });

    it('should return undefined for invalid JSON', () => {
      expect(parseFiltersParam('invalid json')).toBeUndefined();
    });

    it('should return undefined for non-array JSON', () => {
      expect(parseFiltersParam('{"field": "status"}')).toBeUndefined();
    });
  });

  describe('getAllowedSortFields', () => {
    it('should return set of sortable field names', async () => {
      vi.mocked(configModule.getEntityConfig).mockResolvedValue([
        { accessor: 'name', sortable: true },
        { accessor: 'status', sortable: false },
        { accessor: 'priority', sortable: true },
        { accessor: 'id', sortable: undefined }, // undefined should be treated as sortable
      ]);

      const result = await getAllowedSortFields('projects');
      expect(result).toEqual(new Set(['name', 'priority', 'id']));
    });

    it('should return empty set on error', async () => {
      vi.mocked(configModule.getEntityConfig).mockRejectedValue(new Error('Failed'));

      const result = await getAllowedSortFields('projects');
      expect(result).toEqual(new Set());
    });
  });

  describe('getAllowedFilterFields', () => {
    it('should return set of all field accessors', async () => {
      vi.mocked(configModule.getEntityConfig).mockResolvedValue([
        { accessor: 'name' },
        { accessor: 'status' },
        { accessor: 'priority' },
      ]);

      const result = await getAllowedFilterFields('projects');
      expect(result).toEqual(new Set(['name', 'status', 'priority']));
    });

    it('should return empty set on error', async () => {
      vi.mocked(configModule.getEntityConfig).mockRejectedValue(new Error('Failed'));

      const result = await getAllowedFilterFields('projects');
      expect(result).toEqual(new Set());
    });
  });

  describe('validateSortBy', () => {
    it('should return valid sortBy field', () => {
      const allowedFields = new Set(['name', 'status', 'priority']);
      const result = validateSortBy('name', allowedFields, 'projects');
      expect(result).toBe('name');
    });

    it('should return undefined for invalid sortBy field', () => {
      const allowedFields = new Set(['name', 'status']);
      const result = validateSortBy('invalid', allowedFields, 'projects');
      expect(result).toBeUndefined();
    });

    it('should return sortBy when no allowedFields provided', () => {
      const result = validateSortBy('name', undefined, 'projects');
      expect(result).toBe('name');
    });

    it('should return undefined when sortBy is undefined', () => {
      const allowedFields = new Set(['name']);
      const result = validateSortBy(undefined, allowedFields, 'projects');
      expect(result).toBeUndefined();
    });
  });

  describe('validateFilters', () => {
    it('should return valid filters only', () => {
      const filters = [
        { field: 'name', op: 'eq' as const, value: 'test' },
        { field: 'invalid', op: 'eq' as const, value: 'test' },
        { field: 'status', op: 'eq' as const, value: 'active' },
      ];
      const allowedFields = new Set(['name', 'status']);
      const result = validateFilters(filters, allowedFields, 'projects');
      expect(result).toEqual([
        { field: 'name', op: 'eq', value: 'test' },
        { field: 'status', op: 'eq', value: 'active' },
      ]);
    });

    it('should return undefined when all filters are invalid', () => {
      const filters = [{ field: 'invalid', op: 'eq' as const, value: 'test' }];
      const allowedFields = new Set(['name', 'status']);
      const result = validateFilters(filters, allowedFields, 'projects');
      expect(result).toBeUndefined();
    });

    it('should return filters when no allowedFields provided', () => {
      const filters = [{ field: 'name', op: 'eq' as const, value: 'test' }];
      const result = validateFilters(filters, undefined, 'projects');
      expect(result).toEqual(filters);
    });

    it('should return empty array as-is for empty filters array', () => {
      const result = validateFilters([], new Set(['name']), 'projects');
      // Empty array is returned as-is (caller handles it)
      expect(result).toEqual([]);
    });

    it('should return undefined for undefined filters', () => {
      const result = validateFilters(undefined, new Set(['name']), 'projects');
      expect(result).toBeUndefined();
    });
  });

  describe('validateEntityQueryParams', () => {
    it('should validate both sort and filter params', async () => {
      vi.mocked(configModule.getEntityConfig).mockResolvedValue([
        { accessor: 'name', sortable: true },
        { accessor: 'status', sortable: true },
      ]);

      const filters = [{ field: 'status', op: 'eq' as const, value: 'active' }];
      const result = await validateEntityQueryParams('projects', 'name', filters);

      expect(result.sortBy).toBe('name');
      expect(result.filters).toEqual(filters);
    });

    it('should filter out invalid filters', async () => {
      vi.mocked(configModule.getEntityConfig).mockResolvedValue([
        { accessor: 'name', sortable: true },
        { accessor: 'status', sortable: true },
      ]);

      const filters = [
        { field: 'status', op: 'eq' as const, value: 'active' },
        { field: 'invalid', op: 'eq' as const, value: 'test' },
      ];
      const result = await validateEntityQueryParams('projects', 'name', filters);

      expect(result.sortBy).toBe('name');
      expect(result.filters).toEqual([{ field: 'status', op: 'eq', value: 'active' }]);
    });

    it('should return undefined for invalid sortBy', async () => {
      vi.mocked(configModule.getEntityConfig).mockResolvedValue([
        { accessor: 'name', sortable: true },
      ]);

      const result = await validateEntityQueryParams('projects', 'invalid', undefined);
      expect(result.sortBy).toBeUndefined();
    });

    it('should handle no validation needed', async () => {
      const result = await validateEntityQueryParams('projects', undefined, undefined);
      expect(result.sortBy).toBeUndefined();
      expect(result.filters).toBeUndefined();
      expect(configModule.getEntityConfig).not.toHaveBeenCalled();
    });
  });
});
