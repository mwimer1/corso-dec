/**
 * API Route: POST /api/v1/ai/generate-sql
 * 
 * Generates SQL queries from natural language prompts with security validation.
 * 
 * @requires Node.js runtime for Clerk authentication
 * @requires Authentication via Clerk (userId required)
 * @requires Rate limiting: 30 requests per minute
 * 
 * @example
 * ```typescript
 * POST /api/v1/ai/generate-sql
 * Body: { question: "show all active projects" }
 * Response: { success: true, data: { sql: "SELECT * FROM projects WHERE status = 'active'" } }
 * ```
 * 
 * @see {@link https://nextjs.org/docs/app/building-your-application/routing/route-handlers} Next.js Route Handlers
 */

// Node.js required: Clerk authentication
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http } from '@/lib/api';
import { withErrorHandlingNode as withErrorHandling, withRateLimitNode as withRateLimit } from '@/lib/middleware';
import { validateSQLScope } from '@/lib/integrations/database/scope';
import { createOpenAIClient } from '@/lib/integrations/openai/server';
import { handleCors } from '@/lib/middleware';
import { getTenantContext } from '@/lib/server/db/tenant-context';
import { getEnv } from '@/lib/server/env';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Request body schema for SQL generation endpoint.
 * Accepts one of: sql, prompt, query, or question fields.
 */
const BodySchema = z
  .object({
    sql: z.string().optional(),
    prompt: z.string().optional(),
    query: z.string().optional(),
    question: z.string().optional(),
  })
  .strict();


/**
 * Main handler for SQL generation requests.
 * 
 * @param req - Next.js request object
 * @returns HTTP response with generated SQL or error
 * 
 * @throws {401} If user is not authenticated
 * @throws {400} If request body is invalid or contains unsafe SQL
 */
const handler = async (req: NextRequest): Promise<Response> => {
  // Authentication check
  const { userId } = await auth();
  if (!userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }

  // Get tenant context for org isolation
  let tenantContext;
  try {
    tenantContext = await getTenantContext(req);
  } catch (error) {
    // getTenantContext throws ApplicationError with appropriate codes
    if (error && typeof error === 'object' && 'code' in error) {
      const code = error.code as string;
      if (code === 'UNAUTHENTICATED') {
        return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
      }
      if (code === 'MISSING_ORG_CONTEXT') {
        return http.error(400, 'Organization ID required. Provide X-Corso-Org-Id header or ensure org_id in session metadata.', { code: 'MISSING_ORG_CONTEXT' });
      }
    }
    return http.error(400, 'Failed to determine organization context', { code: 'MISSING_ORG_CONTEXT' });
  }
  const { orgId } = tenantContext;

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

  // Security: Sanitize user input to prevent prompt injection
  // Filter out known attack patterns while preserving legitimate queries
  let sanitizedCandidate = candidate.trim();
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /forget\s+(all\s+)?previous\s+instructions?/gi,
    /disregard\s+(all\s+)?previous\s+instructions?/gi,
    /you\s+are\s+now\s+a\s+different\s+(assistant|ai|model)/gi,
    /system\s*:\s*ignore\s+previous/gi,
  ];
  
  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitizedCandidate)) {
      sanitizedCandidate = sanitizedCandidate.replace(pattern, '').trim();
    }
  }
  
  if (!sanitizedCandidate) {
    return http.badRequest('Invalid input: content cannot be empty after sanitization', {
      code: 'VALIDATION_ERROR',
    });
  }

  // Get OpenAI client and model
  const env = getEnv();
  const client = createOpenAIClient();
  const model = env.OPENAI_SQL_MODEL || 'gpt-4o-mini';
  
  // Security: Warn if using unpinned model (model drift risk)
  // Pinned models (e.g., gpt-4-0613) ensure consistent behavior
  // Generic names (e.g., gpt-4) may change with OpenAI updates
  const pinnedModels = ['gpt-4-0613', 'gpt-4-0125', 'gpt-4-turbo-2024-04-09', 'gpt-4o-mini'];
  const isPinned = pinnedModels.some(pinned => model.includes(pinned) || model === pinned);
  if (!isPinned && env.NODE_ENV !== 'production') {
    const { logger } = await import('@/lib/monitoring');
    logger.warn('[AI Security] Using unpinned model - results may vary with OpenAI updates', {
      model,
      recommended: 'Consider pinning to a specific model version for consistency',
    });
  }

  // Build SQL generation prompt
  const systemPrompt = `You are a SQL query generator. Convert natural language questions into valid SQL SELECT queries.

Rules:
- Only generate SELECT queries (no INSERT, UPDATE, DELETE, DROP, etc.)
- Include appropriate WHERE clauses when needed
- Use proper SQL syntax
- Return ONLY the SQL query, no explanations or markdown formatting
- Do not include backticks or code fences
- For queries involving projects, companies, or addresses tables, ensure proper filtering

Example:
Question: "Show all active projects"
SQL: SELECT * FROM projects WHERE status = 'active'

Question: "How many companies have more than 100 employees?"
SQL: SELECT COUNT(*) FROM companies WHERE headcount > 100`;

  try {
    // Call OpenAI to generate SQL
    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: sanitizedCandidate },
      ],
      temperature: 0.3, // Lower temperature for more deterministic SQL
      max_tokens: 500,
    });

    const generatedSQL = completion.choices[0]?.message?.content?.trim() || '';
    
    if (!generatedSQL) {
      return http.badRequest('Failed to generate SQL', { code: 'GENERATION_FAILED' });
    }

    // Security: Validate AI-generated SQL to prevent injection
    // This is a critical security check - all AI-generated SQL must pass validation
    // before execution. validateSQLScope checks for dangerous patterns and tenant isolation.
    try {
      validateSQLScope(generatedSQL, orgId);
    } catch (validationError) {
      // SecurityError from validateSQLScope
      const errorMessage = validationError instanceof Error ? validationError.message : 'Invalid SQL generated';
      return http.badRequest(errorMessage, { code: 'INVALID_SQL' });
    }

    return http.ok({ sql: generatedSQL }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    // Handle OpenAI API errors
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate SQL';
    return http.error(500, `SQL generation failed: ${errorMessage}`, { code: 'GENERATION_ERROR' });
  }
};

export const POST = withErrorHandling(
  withRateLimit(async (req: NextRequest) => handler(req) as any, { windowMs: 60_000, maxRequests: 30 })
);

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}



