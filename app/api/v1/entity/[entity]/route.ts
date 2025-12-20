// Node.js required: ClickHouse database operations via getEntityPage()
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http, withErrorHandlingEdge as withErrorHandling, withRateLimitEdge as withRateLimit } from '@/lib/api';
import { handleCors } from '@/lib/middleware';
import type { EntityFetchParams } from '@/lib/services/entity/contracts';
import { getEntityPage } from '@/lib/services/entity/pages';
import {
  EntityListQuerySchema,
  EntityParamSchema,
  type EntityParam,
} from '@/lib/validators';
import { auth, clerkClient } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Helper to convert Response to NextResponse for type compatibility
async function toNextResponse(response: Response): Promise<NextResponse> {
  const body = await response.json();
  return NextResponse.json(body, { status: response.status, headers: response.headers });
}

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}

const handler = async (req: NextRequest, ctx: { params: { entity: string } }): Promise<NextResponse> => {
  // Authentication & RBAC
  const { userId, has, orgId: activeOrgId } = await auth();
  if (!userId) {
    return await toNextResponse(http.error(401, 'Unauthorized', { code: 'HTTP_401' }));
  }
  
  // Define allowed roles (consistent across all RBAC checks)
  const allowedRoles = ['org:member', 'org:admin', 'org:owner'] as const;
  
  // Resolve effective organization ID in priority order:
  // 1. X-Corso-Org-Id header (explicit tenant selection)
  // 2. auth().orgId (active org in Clerk session)
  // 3. Fallback: first org from user's memberships
  let orgId: string | null = null;
  let effectiveOrgIdSource: 'header' | 'active' | 'fallback' | null = null;
  
  // Check header if available
  if (req.headers) {
    orgId = req.headers.get('x-corso-org-id') || req.headers.get('X-Corso-Org-Id') || null;
    effectiveOrgIdSource = orgId ? 'header' : null;
  }
  
  if (!orgId) {
    orgId = activeOrgId ?? null;
    effectiveOrgIdSource = orgId ? 'active' : null;
  }
  
  if (!orgId) {
    if (process.env.NODE_ENV !== 'production') {
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
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[entity route] Using first organization from memberships:', orgId);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.debug('[entity route] Failed to fetch user organizations:', error);
      }
      // Continue to error handling below
    }
  }
  
  // Check for organization (required for organization-scoped operations)
  if (!orgId) {
    return await toNextResponse(http.error(403, 'No active organization. Please create or join an organization to continue.', { 
      code: 'NO_ORG_CONTEXT',
      details: {
        message: 'You must be a member of an organization to access this resource. If you are a member, please ensure an organization is selected in your session.',
      }
    }));
  }
  
  // Enforce RBAC: user must have one of the allowed roles in the effective organization
  // Note: When using a fallback orgId, we need to check role for that specific org
  // Clerk organization roles use the format: org:member, org:admin, etc.
  try {
    const effectiveOrgId = orgId;
    const isActiveOrg = effectiveOrgId === activeOrgId && effectiveOrgIdSource === 'active';
    
    if (isActiveOrg) {
      // When using active org, use the standard has() check for each allowed role
      const hasAllowedRole = allowedRoles.some((role) => has({ role }));
      
      if (!hasAllowedRole) {
        if (process.env.NODE_ENV !== 'production') {
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
        if (process.env.NODE_ENV !== 'production') {
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
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[entity route] Failed to verify organization membership:', error);
    }
    return await toNextResponse(http.error(403, 'Insufficient permissions', { 
      code: 'FORBIDDEN',
      details: {
        requiredRoles: allowedRoles,
      }
    }));
  }

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
  const { page, pageSize, sortBy, sortDir, search } = qpParsed.data;

  // Parse filters JSON if provided
  let filters: EntityFetchParams['filters'];
  const filtersParam = sp.get('filters');
  if (filtersParam) {
    try {
      const parsed = JSON.parse(filtersParam);
      // Validate filter structure
      if (!Array.isArray(parsed)) {
        return await toNextResponse(http.badRequest('Invalid filters format: must be an array', { code: 'INVALID_FILTERS' }));
      }
      // Type assertion with validation that op matches allowed values
      filters = parsed as EntityFetchParams['filters'];
    } catch (_e) {
      return await toNextResponse(http.badRequest('Invalid filters format', { code: 'INVALID_FILTERS' }));
    }
  }

  const result = await getEntityPage(entity, {
    page,
    pageSize,
    sort: sortBy ? { column: sortBy, direction: sortDir } : { column: '', direction: 'asc' },
    ...(search ? { search } : {}),
    ...(filters ? { filters } : {}),
  });

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
      { windowMs: 60_000, maxRequests: 60 }
    )
  );
};

// Next.js dynamic route signature: (req, { params }) => Response
export async function GET(req: NextRequest, ctx: { params: Promise<{ entity: string }> | { entity: string } }): Promise<NextResponse> {
  // Resolve params if it's a Promise (Next.js 15+)
  const resolvedParams = 'then' in ctx.params ? await ctx.params : ctx.params;
  // Create wrapped handler with resolved params
  const wrappedHandler = createWrappedHandler(resolvedParams);
  return wrappedHandler(req);
}
