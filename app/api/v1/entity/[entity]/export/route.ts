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

  // Export functionality has been removed during entity grid migration
  // Return 410 Gone with deprecation headers
  const entity = ctx.params.entity;
  const sunsetDate = '2025-04-15'; // 90 days from 2025-01-15
  const alternativeEndpoint = `/api/v1/entity/${entity}/query`;
  
  return http.error(410, 'Gone - Export feature no longer available', {
    code: 'EXPORT_REMOVED',
    details: {
      message: 'Export functionality was removed during the entity grid migration. Use entity query endpoints for data access.',
      removedDate: '2025-01-15',
      sunsetDate: sunsetDate,
      alternativeEndpoint: alternativeEndpoint,
    },
    headers: {
      'Deprecation': 'true',
      'Sunset': new Date(sunsetDate).toUTCString(),
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
