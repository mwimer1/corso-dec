// Node.js required: ClickHouse database operations
import { error, noContent } from '@/lib/api/response/http';
import { handleCors } from '@/lib/middleware';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return noContent();
}

export async function GET(_req: NextRequest, _ctx: { params: { entity: string } }) {
  // AuthN
  const { userId } = await auth();
  if (!userId) {
    return error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // Export functionality has been removed during entity grid migration
  // TODO: Re-implement export functionality if needed
  return error(501, 'Export functionality was removed during the entity grid migration', {
    code: 'NOT_IMPLEMENTED',
    details: 'Export functionality was removed during the entity grid migration. Contact development team if this feature is needed.',
  });
}
