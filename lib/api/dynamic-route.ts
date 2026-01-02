// lib/api/dynamic-route.ts
// Server-only helper for Next.js 15+ dynamic route params handling

import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';
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
) => Promise<TResponse> {
  const { rateLimit, withErrorHandling = true } = options;

  // Create the wrapped handler factory
  const createWrappedHandler = (params: TParams) => {
    // Build the wrapper chain
    let wrapped: (req: NextRequest) => Promise<TResponse> | TResponse = async (req: NextRequest): Promise<TResponse> => {
      return handler(req, { params }) as Promise<TResponse>;
    };

    // Apply rate limiting if provided
    if (rateLimit) {
      wrapped = withRateLimitNode(wrapped, rateLimit);
    }

    // Apply error handling if enabled
    if (withErrorHandling) {
      wrapped = withErrorHandlingNode(wrapped);
    }

    return wrapped;
  };

  // Return the route handler that resolves params and creates the wrapper
  return async (
    req: NextRequest,
    ctx: { params: Promise<TParams> | TParams }
  ): Promise<TResponse> => {
    // Resolve params if it's a Promise (Next.js 15+)
    const resolvedParams = 'then' in ctx.params ? await ctx.params : ctx.params;
    
    // Create wrapped handler with resolved params
    const wrappedHandler = createWrappedHandler(resolvedParams);
    
    return wrappedHandler(req);
  };
}
