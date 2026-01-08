// app/api/v1/ai/chat/usage-limits/route.ts
// API endpoint to fetch Deep Research usage limits for current user

import { http } from '@/lib/api';
import { requireAuthWithRBAC } from '@/lib/api/auth-helpers';
import { withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit, RATE_LIMIT_30_PER_MIN } from '@/lib/middleware';
import { checkDeepResearchLimit } from '@/lib/api/ai/chat/usage-limits';
import type { NextRequest } from 'next/server';

/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

/**
 * GET /api/v1/ai/chat/usage-limits
 * Returns current Deep Research usage limits for the authenticated user
 */
const handler = async (req: NextRequest): Promise<Response> => {
  // Authentication and RBAC enforcement
  const authResult = await requireAuthWithRBAC('member');
  if (authResult instanceof Response) {
    return authResult;
  }

  // Check usage limits
  const limitCheck = await checkDeepResearchLimit(req);
  if (limitCheck instanceof Response) {
    return limitCheck;
  }

  return http.ok(limitCheck);
};

export const GET = withErrorHandling(
  withRateLimit(async (req: NextRequest) => handler(req), RATE_LIMIT_30_PER_MIN)
);
