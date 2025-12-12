// Minimal mock types for remaining dependencies
// Note: Sort, Filter, QueryParams, QueryResult are not exported - use MockSort, MockFilter, MockQueryParams from ./shared instead

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

