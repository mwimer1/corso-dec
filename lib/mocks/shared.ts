// Minimal mock utilities for remaining dependencies

// Re-export client-safe types for tests/fixtures in mocks domain
// Note: These are client-safe versions, separate from server-only exports in entity-data.server.ts
export type MockFilter = {
  field: string;
  op: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool';
  value: unknown;
};
export type MockSort = {
  column: string;
  direction: 'asc' | 'desc';
};
export type MockQueryParams = {
  page: number;
  pageSize: number;
  sort: MockSort;
  filters?: MockFilter[];
  search?: string;
};

// Type re-exports removed - types no longer exported from ./types

/**
 * Apply filters to data (internal use only)
 */
function applyFilters<T extends Record<string, unknown>>(
  data: T[],
  filters: Array<{
    field: string;
    op: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool';
    value: unknown;
  }> = []
): T[] {
  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.field];
      if (value === undefined || value === null) return false;

      switch (filter.op) {
        case 'eq':
          return value === filter.value;
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
        case 'gt':
          return Number(value) > Number(filter.value);
        case 'lt':
          return Number(value) < Number(filter.value);
        case 'gte':
          return Number(value) >= Number(filter.value);
        case 'lte':
          return Number(value) <= Number(filter.value);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'between':
          if (Array.isArray(filter.value) && filter.value.length === 2) {
            const [min, max] = filter.value;
            return Number(value) >= Number(min) && Number(value) <= Number(max);
          }
          return false;
        case 'bool':
          return Boolean(value) === Boolean(filter.value);
        default:
          return true;
      }
    });
  });
}

/**
 * Apply search to data (internal use only)
 */
function applySearch<T extends Record<string, unknown>>(
  data: T[],
  search: string
): T[] {
  if (!search) return data;

  const searchLower = search.toLowerCase();
  return data.filter(row => {
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchLower);
    });
  });
}


/**
 * Process query parameters and return paginated results
 */
export function processQuery<T extends Record<string, unknown>>(
  data: T[],
  params: {
    page: number;
    pageSize: number;
    sort: { column: string; direction: 'asc' | 'desc' };
    filters?: Array<{
      field: string;
      op: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool';
      value: unknown;
    }>;
    search?: string;
  }
): { data: T[]; total: number; page: number; pageSize: number } {
  let processed = data;

  // Apply search first
  if (params.search) {
    processed = applySearch(processed, params.search);
  }

  // Apply filters
  if (params.filters && params.filters.length > 0) {
    processed = applyFilters(processed, params.filters);
  }

  // Apply sorting
  processed = [...processed].sort((a, b) => {
    const aVal = a[params.sort.column];
    const bVal = b[params.sort.column];

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal < bVal ? -1 : 1;
    return params.sort.direction === 'desc' ? -comparison : comparison;
  });

  // Apply pagination
  const total = processed.length;
  const startIndex = params.page * params.pageSize;
  const endIndex = startIndex + params.pageSize;
  const paginatedData = processed.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total,
    page: params.page,
    pageSize: params.pageSize,
  };
}

