// lib/api/data.ts
// Edge-safe adapter to serve entity page data, sourcing from public/__mockdb__ when mock flag is on.
import { getEnvEdge } from '@/lib/api/edge';
import { processQuery, type MockFilter, type MockQueryParams, type MockSort } from '@/lib/mocks/shared';
import { normalizeCompanyRow } from './mock-normalizers';

type Filter = MockFilter;
type Sort = MockSort;
type QueryParams = MockQueryParams;

export async function getEntityPage(
  params: {
    entity: 'projects' | 'companies' | 'addresses';
    page: number;
    pageSize: number;
    sort: Sort;
    search?: string;
    filters?: Filter[];
  },
  opts: { baseUrl: URL }
): Promise<{ data: Record<string, unknown>[]; total: number; page: number; pageSize: number }> {
  const env = getEnvEdge();
  // Default to mock in dev/test unless explicitly disabled; production defaults to real DB
  const useMock = (env.CORSO_USE_MOCK_DB ?? 'false') === 'true' || (env.NODE_ENV !== 'production' && env.CORSO_USE_MOCK_DB !== 'false');
  if (!useMock) {
    // Delegate to existing SQL endpoint for real data
    const { entity, page, pageSize, sort, search, filters } = params;
    const sp = new URLSearchParams();
    sp.set('page', String(page));
    sp.set('pageSize', String(pageSize));
    if (sort?.column) sp.set('sortBy', sort.column);
    sp.set('sortDir', sort?.direction ?? 'asc');
    if (search) sp.set('search', search);
    if (filters && filters.length > 0) sp.set('filters', JSON.stringify(filters));
    const url = new URL(`/api/v1/entity/${entity}?${sp.toString()}`, opts.baseUrl);
    const res = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Upstream entity query failed: ${res.status} ${res.statusText} ${body.slice(0, 200)}`);
    }
    const payload = await res.json();
    // Unwrap http.ok shape if needed
    const data = (payload?.success !== undefined && payload?.data) ? payload.data : payload;
    return data as { data: Record<string, unknown>[]; total: number; page: number; pageSize: number };
  }

  // Mock path: fetch from public __mockdb__ JSON and apply in-memory operations
  const file = `__mockdb__/${params.entity}.json`;
  const url = new URL(`/${file}`, opts.baseUrl);
  const res = await fetch(url.toString(), { method: 'GET', cache: 'force-cache' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Mock DB fetch failed: ${res.status} ${res.statusText} ${body.slice(0, 200)}`);
  }
  let all = (await res.json()) as Record<string, unknown>[];

  // Apply normalization for companies to ensure complete, realistic data
  // This only runs in mock mode and does not affect production data paths
  if (params.entity === 'companies') {
    all = all.map((row, index) => normalizeCompanyRow(row, index));
  }

  // Process query using shared utilities
  const queryParams: QueryParams = {
    page: params.page,
    pageSize: params.pageSize,
    sort: params.sort,
    ...(params.search ? { search: params.search } : {}),
    ...(params.filters ? { filters: params.filters.filter(f => f.value !== undefined) } : {}),
  };

  return processQuery(all, queryParams);
}

