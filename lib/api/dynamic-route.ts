// lib/api/dynamic-route.ts
// Server-only helper for Next.js 15+ dynamic route params handling

import 'server-only';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { RateLimitOptions } from '@/lib/ratelimiting';
import { withErrorHandlingNode, withRateLimitNode } from '@/lib/middleware';

/**
 * Handler function signature for dynamic routes.
 * Takes request and context with resolved params.
 */
export type DynamicRouteHandler<TParams extends Record<string, string>, TResponse = Response> = (
  req: NextRequest,
  ctx: { params: TParams }
) => Promise<TResponse>;

/**
 * Options for creating a dynamic route handler wrapper.
 */
export interface DynamicRouteOptions {
  /** Rate limit configuration (e.g., RATE_LIMIT_60_PER_MIN) */
  rateLimit?: RateLimitOptions & { onKey?: (_key: string) => void };
  /** Whether to apply error handling wrapper (default: true) */
  withErrorHandling?: boolean;
}

/**
 * Create a wrapped handler for Next.js 15+ dynamic routes with async params.
 * 
 * This helper handles the pattern where:
 * - Next.js 15+ passes params as `Promise<TParams> | TParams`
 * - Rate limiters expect single-arg functions (just `req`)
 * - We need to resolve params first, then wrap with middleware
 * 
 * Note: Wrappers always return NextResponse, so the return type is NextResponse.
 * This is compatible with Next.js route handlers which accept Response | NextResponse.
 * 
 * @param handler - The route handler function that takes (req, { params })
 * @param options - Wrapper options (rate limiting, error handling)
 * @returns A function that can be exported as the route handler
 * 
 * @example
 * ```typescript
 * const handler = async (req: NextRequest, ctx: { params: { entity: string } }): Promise<Response> => {
 *   const { entity } = ctx.params;
 *   // ... handler logic
 * };
 * 
 * export const POST = createDynamicRouteHandler(handler, {
 *   rateLimit: RATE_LIMIT_60_PER_MIN,
 * });
 * ```
 */
export function createDynamicRouteHandler<
  TParams extends Record<string, string>,
  TResponse extends Response | NextResponse = Response
>(
  handler: DynamicRouteHandler<TParams, TResponse>,
  options: DynamicRouteOptions = {}
): (
  req: NextRequest,
  ctx: { params: Promise<TParams> | TParams }
) => Promise<NextResponse> {
  const { rateLimit, withErrorHandling = true } = options;

  // Create the wrapped handler factory
  const createWrappedHandler = (params: TParams) => {
    // Build the wrapper chain
    // Note: Wrappers always return NextResponse, but handler may return Response | NextResponse
    // Since NextResponse extends Response, this is compatible
    let wrapped: (req: NextRequest) => Promise<NextResponse> = async (req: NextRequest): Promise<NextResponse> => {
      const result = await handler(req, { params });
      // Normalize Response to NextResponse if needed
      if (result instanceof NextResponse) {
        return result;
      }
      // Convert Response to NextResponse
      return new NextResponse(result.body, {
        status: result.status,
        statusText: result.statusText,
        headers: result.headers,
      });
    };

    // Apply rate limiting if provided (returns NextResponse)
    if (rateLimit) {
      wrapped = withRateLimitNode(wrapped, rateLimit);
    }

    // Apply error handling if enabled (returns NextResponse)
    if (withErrorHandling) {
      wrapped = withErrorHandlingNode(wrapped);
    }

    return wrapped;
  };

  // Return the route handler that resolves params and creates the wrapper
  // Note: Return type is NextResponse since wrappers always return NextResponse
  // This is compatible with Next.js route handlers which accept Response | NextResponse
  return async (
    req: NextRequest,
    ctx: { params: Promise<TParams> | TParams }
  ): Promise<NextResponse> => {
    // Resolve params if it's a Promise (Next.js 15+)
    const resolvedParams = 'then' in ctx.params ? await ctx.params : ctx.params;
    
    // Create wrapped handler with resolved params
    const wrappedHandler = createWrappedHandler(resolvedParams);
    
    return wrappedHandler(req);
  };
}
