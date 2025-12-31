import { withErrorHandlingEdge, withRateLimitEdge } from '@/lib/middleware';
import type { NextRequest } from 'next/server';
import type { z } from 'zod';
import { http } from '@/lib/api/http';

type EdgeHandler<T> = (req: NextRequest, input: T) => Promise<Response> | Response;

type MakeEdgeRouteOptions<T> = {
  schema: z.ZodType<T>;
  handler: EdgeHandler<T>;
  rateLimit?: { windowMs: number; maxRequests: number };
};

export function makeEdgeRoute<T>({ schema, handler, rateLimit }: MakeEdgeRouteOptions<T>) {
  const core = async (req: NextRequest): Promise<Response> => {
    let json: unknown = {};
    try {
      json = await req.json();
    } catch {
      // Allow empty bodies; validation will fail if required
      json = {};
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return http.badRequest('Invalid input provided', {
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      });
    }

    return handler(req, parsed.data);
  };

  const guarded = rateLimit
    ? withErrorHandlingEdge(withRateLimitEdge(core as any, rateLimit))
    : withErrorHandlingEdge(core as any);

  return guarded;
}
