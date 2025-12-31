'use client';

import type { EntityFetcher, GridId } from '@/types/dashboard';
import type { IServerSideGetRowsParams } from 'ag-grid-community';

type AgServerRequest = IServerSideGetRowsParams['request'];

/**
 * Minimal type for AG Grid request that may include filterModel
 * Using intersection type to avoid extending conflict with required filterModel
 */
type AgRequestWithFilters = AgServerRequest & {
  filterModel?: Record<string, unknown>;
};

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
function mapAgFiltersToApiFilters(filterModel: Record<string, unknown> | undefined | null): ApiFilter[] | undefined {
  if (!filterModel || typeof filterModel !== 'object') return undefined;
  const out: ApiFilter[] = [];

  for (const [field, model] of Object.entries(filterModel)) {
    if (!model || typeof model !== 'object') continue;

    // Combined filter (AND/OR)
    const modelObj = model as Record<string, unknown>;
    if (modelObj['operator'] && Array.isArray(modelObj['conditions'])) {
      for (const cond of modelObj['conditions'] as unknown[]) {
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

function convertSingleFilter(field: string, m: unknown): ApiFilter | null {
  if (!m || typeof m !== 'object') return null;
  const model = m as Record<string, unknown>;
  const type = String(model['type'] ?? model['filterType'] ?? '').toLowerCase();
  const filterType = String(model['filterType'] ?? '').toLowerCase();

  // Set filter
  if (filterType === 'set' && Array.isArray(model['values'])) {
    return { field, op: 'in', value: model['values'] };
  }

  // Boolean
  if (filterType === 'boolean') {
    return { field, op: 'bool', value: normalizeBoolean(model['filter']) };
  }

  // Number/date
  if (filterType === 'number' || filterType === 'date') {
    switch (type) {
      case 'equals':
        return { field, op: 'eq', value: model['filter'] };
      case 'notequal':
      case 'notEqual':
        return null; // not supported
      case 'lessthan':
      case 'lessThan':
        return { field, op: 'lt', value: model['filter'] };
      case 'lessthanorequal':
      case 'lessThanOrEqual':
        return { field, op: 'lte', value: model['filter'] };
      case 'greaterthan':
      case 'greaterThan':
        return { field, op: 'gt', value: model['filter'] };
      case 'greaterthanorequal':
      case 'greaterThanOrEqual':
        return { field, op: 'gte', value: model['filter'] };
      case 'inrange':
      case 'inRange':
        return { field, op: 'between', value: [model['filter'], model['filterTo']] };
      default:
        return null;
    }
  }

  // Text
  if (filterType === 'text' || !filterType) {
    switch (type) {
      case 'contains':
        return { field, op: 'contains', value: model['filter'] };
      case 'equals':
        return { field, op: 'eq', value: model['filter'] };
      default:
        return null; // startsWith/endsWith not supported by API contract
    }
  }

  return null;
}

/**
 * Minimal type for error objects that may include status, code, and details
 */
interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
  details?: unknown;
}

/**
 * Minimal type for API error response
 * Matches the format returned by http.error(): { success: false, error: { code, message, details? } }
 */
interface ApiErrorResponse {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
  // Legacy format support (for backward compatibility)
  message?: string;
  code?: string;
  details?: unknown;
}

/**
 * Minimal type for API success response payload
 */
interface ApiDataPayload {
  data?: unknown[];
  total?: number;
  page?: number;
  pageSize?: number;
}

/**
 * Minimal type for API success response (wrapped or flat format)
 */
type ApiSuccessResponse = 
  | { success: true; data: ApiDataPayload }
  | ApiDataPayload;

export function createEntityFetcher(entity: GridId): EntityFetcher {
  return async (request, _distinctId, orgId, search) => {
    const { page, sortBy, sortDir } = mapAgRequestToPagingAndSort(request as unknown as AgServerRequest);
    const requestWithFilters = request as unknown as AgRequestWithFilters;
    const filters = mapAgFiltersToApiFilters(requestWithFilters?.filterModel);

    const sp = new URLSearchParams();
    sp.set('page', String(page.index));
    sp.set('pageSize', String(page.size));
    if (sortBy) sp.set('sortBy', sortBy);
    if (sortDir) sp.set('sortDir', sortDir);
    if (filters && filters.length > 0) {
      // Do not double-encode. Let URLSearchParams handle encoding.
      sp.set('filters', JSON.stringify(filters));
    }
    if (search && search.trim()) {
      sp.set('search', search.trim());
    }

    // Build headers with org ID if provided
    const headers: Record<string, string> = {};
    if (orgId) {
      headers['X-Corso-Org-Id'] = orgId;
    }

    const res = await fetch(`/api/v1/entity/${entity}?${sp.toString()}`, { 
      credentials: 'include',
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
    });
    if (!res.ok) {
      // Attempt to parse error response body safely
      let errorMessage = `Entity query failed (${entity}): HTTP ${res.status}`;
      let errorCode: string | undefined;
      let errorDetails: unknown | undefined;
      
      try {
        const errorBody = (await res.json()) as unknown;
        // Runtime guard: ensure errorBody is an object
        if (errorBody && typeof errorBody === 'object') {
          const error = errorBody as ApiErrorResponse;
          // Extract message from nested error object: { success: false, error: { code, message, details? } }
          // Also support legacy flat format: { error: "...", code: "...", details?: ... }
          const apiErrorMessage = 
            (error?.error && typeof error.error === 'object' && error.error.message)
              ? error.error.message
              : (typeof error?.error === 'string' ? error.error : undefined);
          const apiErrorCode = 
            (error?.error && typeof error.error === 'object' && error.error.code)
              ? error.error.code
              : error?.code;
          const apiErrorDetails = 
            (error?.error && typeof error.error === 'object' && error.error.details)
              ? error.error.details
              : error?.details;
          
          // Use extracted message or fallback to top-level message or default
          errorMessage = apiErrorMessage || error?.message || errorMessage;
          errorCode = apiErrorCode;
          errorDetails = apiErrorDetails;
        }
      } catch {
        // If JSON parsing fails, use status-based messages
        if (res.status === 401) {
          errorMessage = 'Unauthorized: Please sign in again.';
        } else if (res.status === 403) {
          errorMessage = 'Forbidden: You do not have permission to access this resource.';
        } else if (res.status === 429) {
          errorMessage = 'Too many requests. Please wait and try again.';
          errorCode = 'RATE_LIMITED';
        } else {
          errorMessage = `Entity query failed (${entity}): HTTP ${res.status}`;
        }
      }
      
      // Create error with status, code, and details for UI to distinguish error types
      const error = new Error(errorMessage) as ErrorWithStatus;
      error.status = res.status;
      if (errorCode) {
        error.code = errorCode;
      } else if (res.status === 429) {
        // Default to RATE_LIMITED for 429 if code not provided
        error.code = 'RATE_LIMITED';
      }
      if (errorDetails !== undefined) {
        error.details = errorDetails;
      }
      throw error;
    }
    
    const json = (await res.json()) as unknown;
    // Runtime guard: ensure json is an object
    if (!json || typeof json !== 'object') {
      throw new Error(`Invalid response format from entity query (${entity})`);
    }
    
    const response = json as ApiSuccessResponse;
    // Handle both response formats:
    // 1. Flat: { data: [...], total, page, pageSize }
    // 2. Wrapped: { success: true, data: { data: [...], total, page, pageSize } }
    const payload: ApiDataPayload = 'success' in response && response.success === true && response.data
      ? response.data
      : (response as ApiDataPayload);
    
    // Runtime guard: ensure payload has expected structure
    const dataArray = payload && typeof payload === 'object' && 'data' in payload && Array.isArray(payload.data) 
      ? payload.data 
      : [];
    const total = payload && typeof payload === 'object' && 'total' in payload && typeof payload.total === 'number'
      ? payload.total
      : null;
    
    return { rows: dataArray, totalSearchCount: total };
  };
}



