// Node.js required: Clerk authentication
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http, withErrorHandlingEdge as withErrorHandling, withRateLimitEdge as withRateLimit } from '@/lib/api';
import { handleCors } from '@/lib/middleware';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const BodySchema = z
  .object({
    sql: z.string().optional(),
    prompt: z.string().optional(),
    query: z.string().optional(),
    question: z.string().optional(),
  })
  .strict();

function isUnsafe(sql: string) {
  const s = sql.toLowerCase();
  // lightweight guard for tests
  return /\bdrop\b|\btruncate\b|\bdelete\b(?!\s+from\s+\w+\s+where)/.test(s);
}

const handler = async (req: NextRequest) => {
  // Authentication check
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  const json = (await req.json().catch(() => ({}))) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return http.badRequest('Invalid body', { code: 'INVALID_BODY', details: parsed.error.flatten() });
  }
  const body = parsed.data;
  const candidate =
    [body.sql, body.prompt, body.query, body.question].find((v) => typeof v === 'string' && v.trim().length > 0)?.trim() ?? '';

  if (!candidate) {
    return http.badRequest('Missing required field', { code: 'VALIDATION_ERROR' });
  }

  if (isUnsafe(candidate)) {
    return http.badRequest('Unsafe SQL detected', { code: 'INVALID_SQL' });
  }

  // TODO: generate SQL from candidate
  return http.ok({ sql: candidate }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST = withErrorHandling(
  withRateLimit(async (req: NextRequest) => handler(req) as any, { windowMs: 60_000, maxRequests: 30 })
);

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}



