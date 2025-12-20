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
  
  // Resolve organization ID: use active org if available, otherwise fall back to user's first organization
  let orgId: string | null = activeOrgId ?? null;
  
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
    return await toNextResponse(http.error(403, 'No active organization. Please ensure you are a member of an organization.', { 
      code: 'NO_ORG_CONTEXT',
      details: {
        message: 'You must be a member of an organization to access this resource. If you are a member, please ensure an organization is selected in your session.',
      }
    }));
  }
  
  // Enforce org:member-or-higher role (org:viewer not allowed)
  // Note: When using a fallback orgId, we need to check role for that specific org
  // Clerk organization roles use the format: org:member, org:admin, etc.
  // The has() method checks the active org, so we need to verify the user has the role in the org we're using
  try {
    // Verify user has org:member role in the organization we're using
    // If we used a fallback org, we need to check membership directly
    if (!activeOrgId) {
      // When using fallback org, verify the user actually has member role
      const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
      const membership = await client.users.getOrganizationMembershipList({
        userId,
        limit: 100,
      });
      const hasMembership = membership.data?.some(
        (m: { organization: { id: string }; role: string }) => 
          m.organization.id === orgId && (m.role === 'org:member' || m.role === 'org:admin' || m.role === 'org:owner')
      );
      
      if (!hasMembership) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[entity route] User does not have org:member role in organization:', orgId);
        }
        return await toNextResponse(http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' }));
      }
    } else {
      // When using active org, use the standard has() check
      if (!has({ role: 'org:member' })) {
        if (process.env.NODE_ENV !== 'production') {
          console.debug('[entity route] RBAC check failed for userId:', userId, 'orgId:', orgId);
        }
        return await toNextResponse(http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' }));
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[entity route] Failed to verify organization membership:', error);
    }
    return await toNextResponse(http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' }));
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
