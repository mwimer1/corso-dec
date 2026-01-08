// lib/dashboard/entity/contracts.ts
// Shared types and interfaces to break circular dependencies

import type { BaseRow } from '@/types/dashboard';

// Local type definition to avoid circular dependency
export type GridId = 'projects' | 'companies' | 'addresses';
export type EntityKind = 'projects' | 'companies' | 'addresses';

export interface EntityFetchParams {
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

export interface EntityFetchResult<T extends BaseRow = BaseRow> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface GridConfig {
  tableName?: string;
  primaryKey?: string;
  columns?: Array<{
    accessorKey: string;
    header?: string;
    [key: string]: unknown;
  }>;
  pinnedLeft?: string[];
  pinnedRight?: string[];
  isAIChat?: boolean;
}

// removed: ENTITY_DEFS (unused)


// Type for the fetchEntityData function
export type FetchEntityDataFn = <T extends BaseRow = BaseRow>(
  slug: string,
  id: string | undefined,
  params: EntityFetchParams
) => Promise<EntityFetchResult<T>>;

// removed: buildEntityQuery (unused, depended on ENTITY_DEFS)

