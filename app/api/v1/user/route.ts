/**
 * API Route: POST /api/v1/user
 * 
 * User profile operations endpoint with RBAC enforcement.
 * 
 * @requires Node.js runtime for Clerk authentication
 * @requires Authentication via Clerk (userId required)
 * @requires RBAC: 'member' role minimum
 * @requires Rate limiting: 30 requests per minute
 * 
 * @example
 * ```typescript
 * POST /api/v1/user
 * Body: { id: "uuid", email: "user@example.com", name: "John Doe" }
 * Response: { success: true, data: { updated: true } }
 * ```
 * 
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/route-handlers} Next.js Route Handlers
 */

// app/api/v1/user/route.ts
// Requires member role – enforced via Clerk v6 RBAC below
import { http, validateJson } from "@/lib/api";
import { withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit } from "@/lib/middleware";
import { corsHeaders, handleCors } from '@/lib/middleware';
// withApiWrappers is re-exported from lib/api to keep imports consistent in tests
import { UserSchema } from "@/lib/validators";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest } from "next/server";
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Main handler for user profile operations.
 * 
 * @param req - Next.js request object with user data in body
 * @returns HTTP response indicating success or error
 * 
 * @throws {401} If user is not authenticated
 * @throws {403} If user lacks 'member' role
 * @throws {400} If request body validation fails
 */
const handler = async (req: NextRequest): Promise<Response> => {
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

