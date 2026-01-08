// Node.js required: ClickHouse database operations
import { http } from '@/lib/api';
import { requireAuth } from '@/lib/api/auth-helpers';
import { createDynamicRouteHandler } from '@/lib/api/dynamic-route';
import { handleOptions, RATE_LIMIT_30_PER_MIN } from '@/lib/middleware';
import type { NextRequest } from 'next/server';

/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

/** @knipignore */
export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

const handler = async (_req: NextRequest, ctx: { params: { entity: string } }): Promise<Response> => {
  // AuthN
  const authResult = await requireAuth();
  if (authResult instanceof Response) {
    return authResult;
  }
  const { userId: _userId } = authResult;

  // Export functionality has been permanently removed during entity grid migration
  // This endpoint is kept as a permanent stub to provide guidance to external clients
  // Returns 410 Gone with deprecation headers pointing to the replacement endpoint
  const entity = ctx.params.entity;
  const removedDate = '2025-01-15';
  const alternativeEndpoint = `/api/v1/entity/${entity}/query`;
  
  return http.error(410, 'Gone - Export feature no longer available', {
    code: 'EXPORT_REMOVED',
    details: {
      message: 'Export functionality was permanently removed during the entity grid migration. Use entity query endpoints for data access.',
      removedDate: removedDate,
      alternativeEndpoint: alternativeEndpoint,
    },
    headers: {
      'Deprecation': 'true',
      'Link': `<${alternativeEndpoint}>; rel="alternate"; type="application/json"`,
    },
  });
};

// Rate limit: 30/min per OpenAPI spec
// Next.js dynamic route signature: (req, { params }) => Response
/** @knipignore */
export const GET = createDynamicRouteHandler(handler, {
  rateLimit: RATE_LIMIT_30_PER_MIN,
});
