/**
 * API Route: POST /api/v1/ai/chat
 * 
 * Streams chat processing responses using OpenAI with NDJSON format.
 * 
 * @requires Node.js runtime for Clerk authentication and OpenAI integration
 * @requires Authentication via Clerk (userId required)
 * @requires Rate limiting: 30 requests per minute
 * 
 * @example
 * ```typescript
 * POST /api/v1/ai/chat
 * Body: { content: "How many projects in 2024?", preferredTable: "projects" }
 * Response: NDJSON stream of { assistantMessage: { content: "...", type: "assistant" }, detectedTableIntent: null, error: null }
 * ```
 */

/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

import { handleOptions, withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit, RATE_LIMIT_30_PER_MIN } from '@/lib/middleware';
import { handleChatRequest } from '@/lib/api/ai/chat/handler';
import { ensureMockDbInitialized } from '@/lib/integrations/mockdb/init-server';
import type { NextRequest } from 'next/server';

/**
 * Main handler for chat requests.
 * Orchestrates authentication, request parsing, and streaming response creation.
 */
const handler = async (req: NextRequest): Promise<Response> => {
  // Ensure mock DB is initialized if enabled (non-blocking, will initialize on first use if this fails)
  ensureMockDbInitialized().catch(() => {
    // Silently fail - mock DB will initialize on first query if needed
  });
  
  return handleChatRequest(req);
};

export const POST = withErrorHandling(
  withRateLimit(
    async (req: NextRequest) => handler(req),
    RATE_LIMIT_30_PER_MIN
  )
);

/** @knipignore */
export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
