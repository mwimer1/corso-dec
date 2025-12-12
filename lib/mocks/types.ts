// Minimal mock types for remaining dependencies
export type Sort = { column: string; direction: 'asc' | 'desc' };
export type Filter = { field: string; op: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool'; value: unknown };

export interface QueryParams {
  page: number;
  pageSize: number;
  sort: Sort;
  filters?: Filter[];
  search?: string;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Additional types for mappers
export type Stringish = string | number | null | undefined;
export interface ProjectsRawRow {
  [key: string]: Stringish;
}
export interface ProjectAdapterOut {
  id: string;
  name: string;
  status: string;
  created_at: string;
}
export interface NormalizeRawRow {
  [key: string]: Stringish;
}
export interface NormalizeOut {
  status: string;
  [key: string]: any;
}

