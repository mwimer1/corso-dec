// app/api/v1/user/route.ts
// Requires member role – enforced via Clerk v6 RBAC below
import { http, validateJson, withErrorHandlingEdge as withErrorHandling, withRateLimitEdge as withRateLimit } from "@/lib/api";
import { corsHeaders, handleCors } from '@/lib/middleware';
// withApiWrappers is re-exported from lib/api to keep imports consistent in tests
import { UserSchema } from "@/lib/validators";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const handler = async (req: NextRequest) => {
  // 1 – Auth and RBAC enforcement using Clerk v6 (member role required per OpenAPI spec)
  const { userId, has } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }
  if (!has({ role: 'member' })) {
    return http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' });
  }

  const parsed = await validateJson(req, UserSchema);
  if (!parsed.success) {
    return http.badRequest('Invalid input', {
      code: 'VALIDATION_ERROR',
      details: parsed.error,
      headers: corsHeaders(req.headers.get('origin') ?? undefined),
    });
  }

  return http.ok({ updated: true }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
};

export const POST = withErrorHandling(
  withRateLimit(async (req: NextRequest) => handler(req) as any, { windowMs: 60_000, maxRequests: 30 })
);

// CORS preflight
export const OPTIONS = (req: NextRequest) => {
  const response = handleCors(req);
  if (response) {
    // Ensure CORS headers are always present
    const newHeaders = new Headers(response.headers);
    if (!newHeaders.has('Access-Control-Allow-Origin')) {
      newHeaders.set('Access-Control-Allow-Origin', '*');
    }
    return new Response(null, {
      status: response.status,
      headers: newHeaders,
    });
  }
  // Fallback for non-preflight requests (shouldn't happen for OPTIONS)
  return new Response(null, {
    status: 204,
    headers: corsHeaders('*'),
  });
};

