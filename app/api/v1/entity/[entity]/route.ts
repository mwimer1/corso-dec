// Node.js required: ClickHouse database operations via getEntityPage()
/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

import { http } from '@/lib/api';
import { createDynamicRouteHandler } from '@/lib/api/dynamic-route';
import type { EntityFetchParams } from '@/lib/entities/contracts';
import { getEntityPage } from '@/lib/entities/pages';
import { resolveOrgContext } from '@/lib/entities/org-resolution';
import {
  type EntityFilter,
  type EntityFilterOp,
  validateEntityQueryParams,
} from '@/lib/entities/validation';
import { handleOptions, RATE_LIMIT_60_PER_MIN } from '@/lib/middleware';
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

// Helper to convert Response to NextResponse for type compatibility
async function toNextResponse(response: Response): Promise<NextResponse> {
  const body = await response.json();
  return NextResponse.json(body, { status: response.status, headers: response.headers });
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
  
  // Define allowed roles (for strict mode only)
  const allowedRoles = ['org:member', 'org:admin', 'org:owner'] as const;
  
  // Resolve organization context
  const orgResolutionResult = await resolveOrgContext(req, userId);
  if (orgResolutionResult instanceof Response) {
    return await toNextResponse(orgResolutionResult);
  }
  const { orgId, source: effectiveOrgIdSource } = orgResolutionResult;
  
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
    // All query parameter validation errors (including filters) return INVALID_QUERY
    // Schema validation handles all parameter validation uniformly
    const errorDetails = qpParsed.error.flatten();
    
    return await toNextResponse(http.badRequest('Invalid query parameters', {
      code: 'INVALID_QUERY',
      details: errorDetails,
    }));
  }
  const { page, pageSize, sortDir, filters: schemaValidatedFilters } = qpParsed.data;

  // Prefer reading these directly from URLSearchParams to avoid any defaulting surprises.
  const sortByRaw = (sp.get('sortBy') ?? '').trim();
  const searchRaw = (sp.get('search') ?? '').trim();
  
  // Convert schema-validated filters to EntityFilter format for entity-specific validation
  // Schema validates structure (JSON format, array shape, operator types, value types, max filters)
  // Entity-specific validation (validateEntityQueryParams) will validate field names against column config
  const parsedFilters: EntityFilter[] | undefined = schemaValidatedFilters?.map((f) => ({
    field: f.field,
    op: f.op as EntityFilterOp,
    value: f.value ?? null, // Convert undefined to null for EntityFilter (schema ensures values for current operators)
  }));
  
  // Validate sort and filter parameters against entity column config
  const { sortBy: validatedSortBy, filters: validatedFilters } = await validateEntityQueryParams(
    entity,
    sortByRaw || undefined,
    parsedFilters
  );

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
// Next.js dynamic route signature: (req, { params }) => Response
/** @knipignore */
export const GET = createDynamicRouteHandler(handler, {
  rateLimit: RATE_LIMIT_60_PER_MIN,
});
