'use client';

import type { IServerSideGetRowsParams } from 'ag-grid-community';
import type { EntityFetcher, GridId } from '@/types/entity-grid';

type AgServerRequest = IServerSideGetRowsParams['request'];

function mapAgRequestToPagingAndSort(request: AgServerRequest): {
  page: { index: number; size: number };
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
} {
  const start = typeof request.startRow === 'number' ? request.startRow : 0;
  const end = typeof request.endRow === 'number' ? request.endRow : start + 50;
  const size = Math.max(1, end - start);
  const index = Math.max(0, Math.floor(start / size));

  const sortModel = Array.isArray(request.sortModel) ? request.sortModel : [];
  const firstSort = sortModel.length > 0 ? sortModel[0] : undefined;
  return {
    page: { index, size },
    ...(firstSort && firstSort.colId && firstSort.sort
      ? { sortBy: String(firstSort.colId), sortDir: String(firstSort.sort) as 'asc' | 'desc' }
      : {}),
  };
}

type ApiFilter = { field: string; op: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool'; value: unknown };

function normalizeBoolean(val: unknown): boolean {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
  return false;
}

// Map AG Grid filter model to API filter array
function mapAgFiltersToApiFilters(filterModel: Record<string, any> | undefined | null): ApiFilter[] | undefined {
  if (!filterModel || typeof filterModel !== 'object') return undefined;
  const out: ApiFilter[] = [];

  for (const [field, model] of Object.entries(filterModel)) {
    if (!model || typeof model !== 'object') continue;

    // Combined filter (AND/OR)
    if (model.operator && Array.isArray(model.conditions)) {
      for (const cond of model.conditions) {
        const converted = convertSingleFilter(field, cond);
        if (converted) out.push(converted);
      }
      continue;
    }

    const single = convertSingleFilter(field, model);
    if (single) out.push(single);
  }

  return out.length > 0 ? out : undefined;
}

function convertSingleFilter(field: string, m: any): ApiFilter | null {
  const type = String(m?.type ?? m?.filterType ?? '').toLowerCase();
  const filterType = String(m?.filterType ?? '').toLowerCase();

  // Set filter
  if (filterType === 'set' && Array.isArray(m.values)) {
    return { field, op: 'in', value: m.values };
  }

  // Boolean
  if (filterType === 'boolean') {
    return { field, op: 'bool', value: normalizeBoolean(m.filter) };
  }

  // Number/date
  if (filterType === 'number' || filterType === 'date') {
    switch (type) {
      case 'equals':
        return { field, op: 'eq', value: m.filter };
      case 'notequal':
      case 'notEqual':
        return null; // not supported
      case 'lessthan':
      case 'lessThan':
        return { field, op: 'lt', value: m.filter };
      case 'lessthanorequal':
      case 'lessThanOrEqual':
        return { field, op: 'lte', value: m.filter };
      case 'greaterthan':
      case 'greaterThan':
        return { field, op: 'gt', value: m.filter };
      case 'greaterthanorequal':
      case 'greaterThanOrEqual':
        return { field, op: 'gte', value: m.filter };
      case 'inrange':
      case 'inRange':
        return { field, op: 'between', value: [m.filter, m.filterTo] };
      default:
        return null;
    }
  }

  // Text
  if (filterType === 'text' || !filterType) {
    switch (type) {
      case 'contains':
        return { field, op: 'contains', value: m.filter };
      case 'equals':
        return { field, op: 'eq', value: m.filter };
      default:
        return null; // startsWith/endsWith not supported by API contract
    }
  }

  return null;
}

export function createEntityFetcher(entity: GridId): EntityFetcher {
  return async (request, _distinctId) => {
    const { page, sortBy, sortDir } = mapAgRequestToPagingAndSort(request as unknown as AgServerRequest);
    const filters = mapAgFiltersToApiFilters((request as any)?.filterModel ?? undefined);

    const sp = new URLSearchParams();
    sp.set('page', String(page.index));
    sp.set('pageSize', String(page.size));
    if (sortBy) sp.set('sortBy', sortBy);
    if (sortDir) sp.set('sortDir', sortDir);
    if (filters && filters.length > 0) {
      // Do not double-encode. Let URLSearchParams handle encoding.
      sp.set('filters', JSON.stringify(filters));
    }

    const res = await fetch(`/api/v1/entity/${entity}?${sp.toString()}`);
    if (!res.ok) throw new Error(`Entity query failed (${entity}): HTTP ${res.status}`);
    const json = (await res.json()) as any;
    const payload = json?.data ?? json;
    return { rows: Array.isArray(payload?.data) ? payload.data : [], totalSearchCount: typeof payload?.total === 'number' ? payload.total : null };
  };
}



