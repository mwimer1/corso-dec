// Node.js required: ClickHouse database operations via getEntityPage()
/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

import { http } from '@/lib/api';
import { getEntityConfig } from '@/lib/entities/config';
import type { EntityFetchParams } from '@/lib/entities/contracts';
import { getEntityPage } from '@/lib/entities/pages';
import { handleOptions, withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit, RATE_LIMIT_60_PER_MIN } from '@/lib/middleware';
import { isRelaxedAuthMode } from '@/lib/shared/config/auth-mode';
import {
  EntityListQuerySchema,
  EntityParamSchema,
  type EntityParam,
} from '@/lib/validators';
import { auth, clerkClient } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const SHOULD_LOG =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

type EntityFilterOp = 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool';
type EntityFilter = { field: string; op: EntityFilterOp; value: unknown };

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

function parseFiltersParam(raw: string | null): EntityFilter[] | undefined {
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

// Helper to convert Response to NextResponse for type compatibility
async function toNextResponse(response: Response): Promise<NextResponse> {
  const body = await response.json();
  return NextResponse.json(body, { status: response.status, headers: response.headers });
}

/**
 * Get allowed sort field names for an entity (only columns where sortable !== false)
 */
async function getAllowedSortFields(entity: EntityParam): Promise<Set<string>> {
  try {
    const columns = await getEntityConfig(entity);
    return new Set(
      columns
        .filter((col) => col.sortable !== false)
        .map((col) => col.accessor)
    );
  } catch (error) {
    if (SHOULD_LOG) {
      console.warn(`[entity route] Failed to load sort fields for ${entity}:`, error);
    }
    return new Set();
  }
}

/**
 * Get allowed filter field names for an entity (all column accessors, filterable by default)
 */
async function getAllowedFilterFields(entity: EntityParam): Promise<Set<string>> {
  try {
    const columns = await getEntityConfig(entity);
    // For now treat all accessors as filterable.
    // If/when TableColumnConfig adds `filterable`, update this to respect it.
    return new Set(columns.map((col) => col.accessor));
  } catch (error) {
    if (SHOULD_LOG) {
      console.warn(`[entity route] Failed to load filter fields for ${entity}:`, error);
    }
    return new Set();
  }
}

/** @knipignore */
export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

const handler = async (req: NextRequest, ctx: { params: { entity: string } }): Promise<NextResponse> => {
  // Authentication (always required)
  const { userId, has, orgId: activeOrgId } = await auth();
  if (!userId) {
    return await toNextResponse(http.error(401, 'Unauthorized', { code: 'HTTP_401' }));
  }
  
  // Check auth mode
  const isRelaxed = isRelaxedAuthMode();
  
  // Log auth mode for debugging (dev only)
  if (isRelaxed && SHOULD_LOG) {
    console.debug('[entity route] Relaxed auth mode enabled - org/RBAC checks bypassed');
  }
  
  // Define allowed roles (for strict mode only)
  const allowedRoles = ['org:member', 'org:admin', 'org:owner'] as const;
  
  // Resolve effective organization ID (skip in relaxed mode if no org present)
  let orgId: string | null = null;
  let effectiveOrgIdSource: 'header' | 'active' | 'fallback' | null = null;
  
  if (!isRelaxed) {
    // Strict mode: resolve org ID in priority order:
    // 1. X-Corso-Org-Id header (explicit tenant selection)
    // 2. auth().orgId (active org in Clerk session)
    // 3. Fallback: first org from user's memberships
    if (req.headers) {
      orgId = req.headers.get('x-corso-org-id') || req.headers.get('X-Corso-Org-Id') || null;
      effectiveOrgIdSource = orgId ? 'header' : null;
    }
    
    if (!orgId) {
      orgId = activeOrgId ?? null;
      effectiveOrgIdSource = orgId ? 'active' : null;
    }
    
    if (!orgId) {
      if (SHOULD_LOG) {
        console.debug('[entity route] No active organization found for userId:', userId, '- attempting to fetch user organizations');
      }
      
      try {
        // Get user's organization memberships and use the first one
        // Note: clerkClient may be a function in some Clerk versions, but types suggest it's an object
        const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
        const orgMemberships = await client.users.getOrganizationMembershipList({
          userId,
          limit: 1,
        });
        
        if (orgMemberships.data && orgMemberships.data.length > 0 && orgMemberships.data[0]) {
          orgId = orgMemberships.data[0].organization.id;
          effectiveOrgIdSource = 'fallback';
          if (SHOULD_LOG) {
            console.debug('[entity route] Using first organization from memberships:', orgId);
          }
        }
      } catch (error) {
        if (SHOULD_LOG) {
          console.debug('[entity route] Failed to fetch user organizations:', error);
        }
        // Continue to error handling below
      }
    }
    
    // Check for organization (required in strict mode)
    if (!orgId) {
      return await toNextResponse(http.error(403, 'No active organization. Please create or join an organization to continue.', { 
        code: 'NO_ORG_CONTEXT',
        details: {
          message: 'You must be a member of an organization to access this resource. If you are a member, please ensure an organization is selected in your session.',
        }
      }));
    }
  } else {
    // Relaxed mode: try to get orgId from header or active session, but don't require it
    if (req.headers) {
      orgId = req.headers.get('x-corso-org-id') || req.headers.get('X-Corso-Org-Id') || null;
      effectiveOrgIdSource = orgId ? 'header' : null;
    }
    
    if (!orgId) {
      orgId = activeOrgId ?? null;
      effectiveOrgIdSource = orgId ? 'active' : null;
    }
    // In relaxed mode, orgId can be null - we'll use userId as tenant fallback
  }
  
  // Enforce RBAC (skip in relaxed mode)
  if (!isRelaxed && orgId) {
    try {
      const effectiveOrgId = orgId;
      const isActiveOrg = effectiveOrgId === activeOrgId && effectiveOrgIdSource === 'active';
      
      if (isActiveOrg) {
        // When using active org, use the standard has() check for each allowed role
        const hasAllowedRole = allowedRoles.some((role) => has({ role }));
        
        if (!hasAllowedRole) {
          if (SHOULD_LOG) {
            console.debug('[entity route] RBAC check failed for userId:', userId, 'orgId:', effectiveOrgId, 'allowedRoles:', allowedRoles);
          }
          return await toNextResponse(http.error(403, 'Insufficient permissions', { 
            code: 'FORBIDDEN',
            details: {
              requiredRoles: allowedRoles,
            }
          }));
        }
      } else {
        // When using fallback org or header-specified org, verify membership directly
        const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
        const membership = await client.users.getOrganizationMembershipList({
          userId,
          limit: 100,
        });
        const hasMembership = membership.data?.some(
          (m: { organization: { id: string }; role: string }) => {
            const role = m.role as string;
            return m.organization.id === effectiveOrgId && allowedRoles.includes(role as typeof allowedRoles[number]);
          }
        );
        
        if (!hasMembership) {
          if (SHOULD_LOG) {
            console.debug('[entity route] User does not have allowed role in organization:', effectiveOrgId, 'allowedRoles:', allowedRoles);
          }
          return await toNextResponse(http.error(403, 'Insufficient permissions', { 
            code: 'FORBIDDEN',
            details: {
              requiredRoles: allowedRoles,
            }
          }));
        }
      }
    } catch (error) {
      if (SHOULD_LOG) {
        console.debug('[entity route] Failed to verify organization membership:', error);
      }
      return await toNextResponse(http.error(403, 'Insufficient permissions', { 
        code: 'FORBIDDEN',
        details: {
          requiredRoles: allowedRoles,
        }
      }));
    }
  }
  
  // Note: Tenant scoping is handled at the data layer via getEntityPage()
  // orgId is used directly in the query, no need for separate tenantId variable

  // Entity param validation
  const entityParsed = EntityParamSchema.safeParse((ctx.params?.entity ?? '').toLowerCase());
  if (!entityParsed.success) {
    return await toNextResponse(http.badRequest('Invalid entity type', { code: 'INVALID_ENTITY' }));
  }
  const entity = entityParsed.data as EntityParam;

  // Query params validation
  const sp = req.nextUrl.searchParams;
  const queryObj = Object.fromEntries(sp.entries());
  const qpParsed = EntityListQuerySchema.safeParse(queryObj);
  if (!qpParsed.success) {
    return await toNextResponse(http.badRequest('Invalid query parameters', {
      code: 'INVALID_QUERY',
      details: qpParsed.error.flatten(),
    }));
  }
  const { page, pageSize, sortDir } = qpParsed.data;

  // Prefer reading these directly from URLSearchParams to avoid any defaulting surprises.
  const sortByRaw = (sp.get('sortBy') ?? '').trim();
  const searchRaw = (sp.get('search') ?? '').trim();
  const filtersParamRaw = sp.get('filters');
  
  // Validate filters param: if present, must be valid JSON array
  if (filtersParamRaw !== null) {
    try {
      const candidates = [filtersParamRaw];
      try {
        candidates.unshift(decodeURIComponent(filtersParamRaw));
      } catch {
        // ignore decode failures
      }
      
      let parsed: unknown;
      let parseSuccess = false;
      for (const c of candidates) {
        try {
          parsed = JSON.parse(c);
          parseSuccess = true;
          break;
        } catch {
          // try next candidate
        }
      }
      
      if (!parseSuccess) {
        return await toNextResponse(http.badRequest('Invalid filters format', { code: 'INVALID_FILTERS' }));
      }
      
      if (!Array.isArray(parsed)) {
        return await toNextResponse(http.badRequest('Invalid filters format: must be an array', { code: 'INVALID_FILTERS' }));
      }
    } catch {
      return await toNextResponse(http.badRequest('Invalid filters format', { code: 'INVALID_FILTERS' }));
    }
  }
  
  const parsedFilters = parseFiltersParam(filtersParamRaw);

  // Load column config once if needed for validation (avoid duplicate loads)
  const needsValidation = sortByRaw || parsedFilters;
  let allowedSortFields: Set<string> | undefined;
  let allowedFilterFields: Set<string> | undefined;
  
  if (needsValidation) {
    // Load both sets in parallel to optimize when both are needed
    if (sortByRaw && parsedFilters) {
      [allowedSortFields, allowedFilterFields] = await Promise.all([
        getAllowedSortFields(entity),
        getAllowedFilterFields(entity),
      ]);
    } else if (sortByRaw) {
      allowedSortFields = await getAllowedSortFields(entity);
    } else if (parsedFilters) {
      allowedFilterFields = await getAllowedFilterFields(entity);
    }
  }

  // Validate sortBy against allowed sort fields
  let validatedSortBy: string | undefined = sortByRaw;
  if (validatedSortBy && allowedSortFields) {
    if (!allowedSortFields.has(validatedSortBy)) {
      // Invalid sortBy: log warning in dev, ignore sortBy (fall back to no sort)
      if (SHOULD_LOG) {
        console.warn(
          `[entity route] Invalid sortBy field "${validatedSortBy}" for entity "${entity}". ` +
          `Allowed fields: ${Array.from(allowedSortFields).join(', ')}. ` +
          `Ignoring sortBy and using default sort.`
        );
      }
      validatedSortBy = undefined;
    }
  }

  // Validate filter field names against allowed filter fields
  let validatedFilters: EntityFetchParams['filters'] | undefined = parsedFilters;
  if (parsedFilters && parsedFilters.length > 0) {
    if (!allowedFilterFields) {
      allowedFilterFields = await getAllowedFilterFields(entity);
    }
    const validFilters: EntityFilter[] = [];
    const invalidFields: string[] = [];
    
    for (const filter of parsedFilters) {
      if (allowedFilterFields.has(filter.field)) {
        validFilters.push(filter);
      } else {
        invalidFields.push(filter.field);
      }
    }
    
    if (invalidFields.length > 0) {
      if (SHOULD_LOG) {
        console.warn(
          `[entity route] Invalid filter fields for entity "${entity}": ${invalidFields.join(', ')}. ` +
          `These filters will be ignored.`
        );
      }
    }
    
    validatedFilters = validFilters.length > 0 ? (validFilters as EntityFetchParams['filters']) : undefined;
  }

  // Build params object - tests expect search/filters keys to exist even when undefined
  // Use type assertion to work around exactOptionalPropertyTypes while satisfying test expectations
  const params = {
    page,
    pageSize,
    sort: validatedSortBy
      ? { column: validatedSortBy, direction: sortDir }
      : { column: '', direction: 'asc' },
    // Tests expect these keys to exist, even when undefined
    search: searchRaw ? searchRaw : undefined,
    filters: validatedFilters ?? undefined,
  } as EntityFetchParams;

  const result = await getEntityPage(entity, params);

  // Return standardized response shape: { success: true, data: { data, total, page, pageSize } }
  // The client fetcher handles both wrapped and flat formats for backward compatibility
  const payload = {
    data: result?.data ?? [],
    total: result?.total ?? 0,
    page,
    pageSize,
  };
  return await toNextResponse(http.ok(payload));
};

// Rate limit: 60/min per OpenAPI spec
// Note: Next.js passes params as second argument, but rate limiter expects single-arg function
// We wrap the handler to extract params from URL for rate limiting, then use actual params in handler
const createWrappedHandler = (params: { entity: string }) => {
  return withErrorHandling(
    withRateLimit(
      async (req: NextRequest): Promise<NextResponse> => {
        return handler(req, { params });
      },
      RATE_LIMIT_60_PER_MIN
    )
  );
};

// Next.js dynamic route signature: (req, { params }) => Response
/** @knipignore */
export async function GET(req: NextRequest, ctx: { params: Promise<{ entity: string }> | { entity: string } }): Promise<NextResponse> {
  // Resolve params if it's a Promise (Next.js 15+)
  const resolvedParams = 'then' in ctx.params ? await ctx.params : ctx.params;
  // Create wrapped handler with resolved params
  const wrappedHandler = createWrappedHandler(resolvedParams);
  return wrappedHandler(req);
}
