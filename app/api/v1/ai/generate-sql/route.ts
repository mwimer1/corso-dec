// Edge preferred; add explicit dynamic caching controls for consistency
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http } from '@/lib/api';
import { handleCors } from '@/lib/middleware';
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

export async function POST(req: Request) {
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
}

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}



