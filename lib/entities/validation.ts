// lib/entities/validation.ts
// Entity route validation helpers - extracted from route handlers for reusability

import 'server-only';

import { getEntityConfig } from './config';
import type { EntityParam } from '../validators/entityListQuery';
import type { EntityFetchParams } from './contracts';

/**
 * Valid filter operations for entity queries
 */
export type EntityFilterOp = 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool';

/**
 * Entity filter structure
 */
export type EntityFilter = { field: string; op: EntityFilterOp; value: unknown };

const FILTER_OPS: ReadonlySet<string> = new Set([
  'eq',
  'contains',
  'gt',
  'lt',
  'gte',
  'lte',
  'in',
  'between',
  'bool',
]);

/**
 * Parse filters from URL search param (JSON string format)
 * 
 * Handles URL decoding and validates filter structure.
 * Returns undefined if param is null/empty or parsing fails.
 */
export function parseFiltersParam(raw: string | null): EntityFilter[] | undefined {
  if (!raw) return undefined;

  // `URLSearchParams.get()` is already decoded in most cases,
  // but we defensively attempt both decoded + raw parse.
  const candidates = [raw];
  try {
    candidates.unshift(decodeURIComponent(raw));
  } catch {
    // ignore decode failures
  }

  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c);
      if (!Array.isArray(parsed)) continue;

      const filters: EntityFilter[] = [];
      for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const field = (item as any).field;
        const op = (item as any).op;
        const value = (item as any).value;
        if (typeof field !== 'string' || field.trim() === '') continue;
        if (typeof op !== 'string' || !FILTER_OPS.has(op)) continue;
        // Keep numeric/boolean/etc values as-is; service layer handles coercion.
        if (value === undefined) continue;
        filters.push({ field, op: op as EntityFilterOp, value });
      }

      return filters.length > 0 ? filters : undefined;
    } catch {
      // try next candidate
    }
  }

  return undefined;
}

/**
 * Get allowed sort field names for an entity (only columns where sortable !== false)
 */
export async function getAllowedSortFields(entity: EntityParam): Promise<Set<string>> {
  try {
    const columns = await getEntityConfig(entity);
    return new Set(
      columns
        .filter((col) => col.sortable !== false)
        .map((col) => col.accessor)
    );
  } catch (error) {
    const shouldLog = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
    if (shouldLog) {
      console.warn(`[entity validation] Failed to load sort fields for ${entity}:`, error);
    }
    return new Set();
  }
}

/**
 * Get allowed filter field names for an entity (all column accessors, filterable by default)
 */
export async function getAllowedFilterFields(entity: EntityParam): Promise<Set<string>> {
  try {
    const columns = await getEntityConfig(entity);
    // For now treat all accessors as filterable.
    // If/when TableColumnConfig adds `filterable`, update this to respect it.
    return new Set(columns.map((col) => col.accessor));
  } catch (error) {
    const shouldLog = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
    if (shouldLog) {
      console.warn(`[entity validation] Failed to load filter fields for ${entity}:`, error);
    }
    return new Set();
  }
}

/**
 * Validate sortBy field against allowed sort fields for an entity.
 * 
 * @param sortBy - Sort field to validate
 * @param allowedFields - Set of allowed sort field names
 * @param entity - Entity type (for logging)
 * @returns Validated sortBy field, or undefined if invalid (should be ignored)
 */
export function validateSortBy(
  sortBy: string | undefined,
  allowedFields: Set<string> | undefined,
  entity: EntityParam
): string | undefined {
  if (!sortBy || !allowedFields) {
    return sortBy;
  }

  if (!allowedFields.has(sortBy)) {
    const shouldLog = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
    if (shouldLog) {
      console.warn(
        `[entity validation] Invalid sortBy field "${sortBy}" for entity "${entity}". ` +
        `Allowed fields: ${Array.from(allowedFields).join(', ')}. ` +
        `Ignoring sortBy and using default sort.`
      );
    }
    return undefined;
  }

  return sortBy;
}

/**
 * Validate filters against allowed filter fields for an entity.
 * 
 * Invalid filters are filtered out (not returned). A warning is logged in dev mode.
 * 
 * @param filters - Filters to validate
 * @param allowedFields - Set of allowed filter field names
 * @param entity - Entity type (for logging)
 * @returns Valid filters only (invalid fields filtered out)
 */
export function validateFilters(
  filters: EntityFilter[] | undefined,
  allowedFields: Set<string> | undefined,
  entity: EntityParam
): EntityFilter[] | undefined {
  if (!filters || filters.length === 0) {
    return filters;
  }

  if (!allowedFields) {
    return filters; // Can't validate without allowed fields, pass through
  }

  const validFilters: EntityFilter[] = [];
  const invalidFields: string[] = [];

  for (const filter of filters) {
    if (allowedFields.has(filter.field)) {
      validFilters.push(filter);
    } else {
      invalidFields.push(filter.field);
    }
  }

  if (invalidFields.length > 0) {
    const shouldLog = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';
    if (shouldLog) {
      console.warn(
        `[entity validation] Invalid filter fields for entity "${entity}": ${invalidFields.join(', ')}. ` +
        `These filters will be ignored.`
      );
    }
  }

  return validFilters.length > 0 ? validFilters : undefined;
}

/**
 * Validate and normalize filter/sort parameters for entity queries.
 * 
 * This is a convenience function that loads column config and validates both
 * sort and filter parameters in parallel when needed.
 * 
 * @param entity - Entity type
 * @param sortBy - Sort field to validate (optional)
 * @param filters - Filters to validate (optional)
 * @returns Object with validated sortBy and filters
 */
export async function validateEntityQueryParams(
  entity: EntityParam,
  sortBy?: string,
  filters?: EntityFilter[]
): Promise<{ sortBy: string | undefined; filters: EntityFetchParams['filters'] }> {
  // Load column config only if validation is needed
  const needsValidation = !!sortBy || (filters && filters.length > 0);
  
  if (!needsValidation) {
    return { sortBy, filters };
  }

  // Load both sets in parallel to optimize when both are needed
  let allowedSortFields: Set<string> | undefined;
  let allowedFilterFields: Set<string> | undefined;

  if (sortBy && filters && filters.length > 0) {
    [allowedSortFields, allowedFilterFields] = await Promise.all([
      getAllowedSortFields(entity),
      getAllowedFilterFields(entity),
    ]);
  } else if (sortBy) {
    allowedSortFields = await getAllowedSortFields(entity);
  } else if (filters && filters.length > 0) {
    allowedFilterFields = await getAllowedFilterFields(entity);
  }

  // Validate sortBy
  const validatedSortBy = validateSortBy(sortBy, allowedSortFields, entity);

  // Validate filters
  const validatedFilters = validateFilters(filters, allowedFilterFields, entity);

  return {
    sortBy: validatedSortBy,
    filters: validatedFilters as EntityFetchParams['filters'],
  };
}
