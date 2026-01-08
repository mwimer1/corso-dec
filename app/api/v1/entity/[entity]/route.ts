// Node.js required: ClickHouse database operations via getEntityPage()
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { badRequest, error, noContent } from '@/lib/api/response/http';
import { handleCors } from '@/lib/middleware';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
// If your repo exposes a CORS helper, prefer it here:
// import { handleCors } from '@/lib/middleware';
import { getEntityPage } from '@/lib/services/entity/pages';
import {
    EntityListQuerySchema,
    EntityParamSchema,
    type EntityParam,
} from '@/lib/validators';

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return noContent();
}

export async function GET(req: NextRequest, ctx: { params: { entity: string } }) {
  // AuthN
  const { userId } = await auth();
  if (!userId) {
    return error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // Entity param validation
  const entityParsed = EntityParamSchema.safeParse((ctx.params?.entity ?? '').toLowerCase());
  if (!entityParsed.success) {
    return badRequest('Invalid entity type', { code: 'INVALID_ENTITY' });
  }
  const entity = entityParsed.data as EntityParam;

  // Query params validation
  const sp = req.nextUrl.searchParams;
  const queryObj = Object.fromEntries(sp.entries());
  const qpParsed = EntityListQuerySchema.safeParse(queryObj);
  if (!qpParsed.success) {
    return badRequest('Invalid query parameters', {
      code: 'INVALID_QUERY',
      details: qpParsed.error.flatten(),
    });
  }
  const { page, pageSize, sortBy, sortDir, search } = qpParsed.data;

  try {
    const result = await getEntityPage(entity, {
      page,
      pageSize,
      sort: sortBy ? { column: sortBy, direction: sortDir } : { column: '', direction: 'asc' },
      ...(search ? { search } : {}),
      // TODO: Transform filters from Record<string, any> to Filter[] array format if needed
      // For now, filters are not passed through to avoid type mismatch
    });

    // Return flat response shape: { data, total, page, pageSize }
    const payload = {
      data: result?.data ?? [],
      total: result?.total ?? 0,
      page,
      pageSize,
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return error(500, 'Failed to fetch entity data', {
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV !== 'production' ? String(e) : undefined,
    });
  }
}
