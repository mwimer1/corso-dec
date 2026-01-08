/**
 * Unit tests for dynamic route handler helper
 * 
 * Tests createDynamicRouteHandler to ensure it correctly:
 * - Resolves Promise params (Next.js 15+)
 * - Handles synchronous params (Next.js 14)
 * - Applies rate limiting and error handling wrappers
 * - Preserves handler behavior and error propagation
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { createDynamicRouteHandler } from '@/lib/api/dynamic-route';
import { RATE_LIMIT_60_PER_MIN } from '@/lib/middleware';

describe('createDynamicRouteHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Params resolution', () => {
    it('should resolve Promise params (Next.js 15+)', async () => {
      const handler = vi.fn(async (req: NextRequest, ctx: { params: { entity: string } }) => {
        return new Response(JSON.stringify({ entity: ctx.params.entity }), {
          headers: { 'content-type': 'application/json' },
        });
      });

      const routeHandler = createDynamicRouteHandler(handler, {
        rateLimit: RATE_LIMIT_60_PER_MIN,
      });

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      const paramsPromise = Promise.resolve({ entity: 'projects' });

      const result = await routeHandler(req, { params: paramsPromise });

      expect(handler).toHaveBeenCalledWith(req, { params: { entity: 'projects' } });
      expect(result).toBeInstanceOf(Response);
    });

    it('should handle synchronous params (Next.js 14)', async () => {
      const handler = vi.fn(async (req: NextRequest, ctx: { params: { entity: string } }) => {
        return new Response(JSON.stringify({ entity: ctx.params.entity }), {
          headers: { 'content-type': 'application/json' },
        });
      });

      const routeHandler = createDynamicRouteHandler(handler, {
        rateLimit: RATE_LIMIT_60_PER_MIN,
      });

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      const params = { entity: 'projects' };

      const result = await routeHandler(req, { params });

      expect(handler).toHaveBeenCalledWith(req, { params: { entity: 'projects' } });
      expect(result).toBeInstanceOf(Response);
    });

    it('should detect Promise params using "then" check', async () => {
      const handler = vi.fn(async (req: NextRequest, ctx: { params: { entity: string } }) => {
        return new Response(JSON.stringify({ entity: ctx.params.entity }), {
          headers: { 'content-type': 'application/json' },
        });
      });

      const routeHandler = createDynamicRouteHandler(handler);

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      // Create a thenable object (Promise-like)
      const thenableParams = {
        then: (onFulfilled: (value: { entity: string }) => void) => {
          onFulfilled({ entity: 'projects' });
          return Promise.resolve({ entity: 'projects' });
        },
      };

      const result = await routeHandler(req, { params: thenableParams as any });

      expect(handler).toHaveBeenCalledWith(req, { params: { entity: 'projects' } });
      expect(result).toBeInstanceOf(Response);
    });
  });

  describe('Middleware composition', () => {
    it('should apply error handling wrapper by default', async () => {
      const handler = vi.fn(async (_req: NextRequest, _ctx: { params: { entity: string } }) => {
        return new Response('OK');
      });

      const routeHandler = createDynamicRouteHandler(handler);

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      const result = await routeHandler(req, { params: { entity: 'projects' } });

      // Error handling is applied (errors would be caught and converted to responses)
      expect(handler).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Response);
    });

    it('should apply rate limiting wrapper when provided', async () => {
      const handler = vi.fn(async (_req: NextRequest, _ctx: { params: { entity: string } }) => {
        return new Response('OK');
      });

      const routeHandler = createDynamicRouteHandler(handler, {
        rateLimit: RATE_LIMIT_60_PER_MIN,
      });

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      const result = await routeHandler(req, { params: { entity: 'projects' } });

      // Rate limiting is applied (would throw 429 if exceeded, but we're not testing that here)
      expect(handler).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Response);
    });

    it('should skip error handling when withErrorHandling is false', async () => {
      const handler = vi.fn(async (_req: NextRequest, _ctx: { params: { entity: string } }) => {
        return new Response('OK');
      });

      const routeHandler = createDynamicRouteHandler(handler, {
        withErrorHandling: false,
      });

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      const result = await routeHandler(req, { params: { entity: 'projects' } });

      expect(handler).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Response);
    });

  });

  describe('Error propagation', () => {
    it('should handle errors from handler (error handling wrapper applied)', async () => {
      const handler = vi.fn(async (_req: NextRequest, _ctx: { params: { entity: string } }) => {
        throw new Error('Handler error');
      });

      const routeHandler = createDynamicRouteHandler(handler);

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      
      // Error handling wrapper should catch and convert to error response
      const result = await routeHandler(req, { params: { entity: 'projects' } });
      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBeGreaterThanOrEqual(400);
    });

    it('should propagate errors from params resolution', async () => {
      const handler = vi.fn(async (_req: NextRequest, _ctx: { params: { entity: string } }) => {
        return new Response('OK');
      });

      const routeHandler = createDynamicRouteHandler(handler);

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      const paramsPromise = Promise.reject(new Error('Params resolution error'));

      await expect(routeHandler(req, { params: paramsPromise })).rejects.toThrow('Params resolution error');
    });
  });

  describe('Response type preservation', () => {
    it('should preserve Response type', async () => {
      const handler = vi.fn(async (_req: NextRequest, _ctx: { params: { entity: string } }): Promise<Response> => {
        return new Response('OK');
      });

      const routeHandler = createDynamicRouteHandler(handler);

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      const result = await routeHandler(req, { params: { entity: 'projects' } });

      expect(result).toBeInstanceOf(Response);
    });

    it('should preserve NextResponse type', async () => {
      const handler = vi.fn(async (_req: NextRequest, _ctx: { params: { entity: string } }): Promise<NextResponse> => {
        return NextResponse.json({ ok: true });
      });

      const routeHandler = createDynamicRouteHandler(handler);

      const req = new NextRequest('http://localhost/api/v1/entity/projects');
      const result = await routeHandler(req, { params: { entity: 'projects' } });

      expect(result).toBeInstanceOf(NextResponse);
    });
  });

  describe('Behavior equivalence with original routes', () => {
    it('should match query route wrapper pattern', async () => {
      const handler = vi.fn(async (req: NextRequest, ctx: { params: { entity: string } }) => {
        return new Response(JSON.stringify({ entity: ctx.params.entity }), {
          headers: { 'content-type': 'application/json' },
        });
      });

      const routeHandler = createDynamicRouteHandler(handler, {
        rateLimit: RATE_LIMIT_60_PER_MIN,
      });

      const req = new NextRequest('http://localhost/api/v1/entity/projects/query');
      const paramsPromise = Promise.resolve({ entity: 'projects' });

      const result = await routeHandler(req, { params: paramsPromise });

      // Original pattern: resolved params -> createWrappedHandler -> withErrorHandling(withRateLimit(...))
      expect(handler).toHaveBeenCalledWith(req, { params: { entity: 'projects' } });
      expect(result).toBeInstanceOf(Response);
    });

    it('should match export route wrapper pattern', async () => {
      const handler = vi.fn(async (_req: NextRequest, _ctx: { params: { entity: string } }) => {
        return new Response('410 Gone', { status: 410 });
      });

      const routeHandler = createDynamicRouteHandler(handler, {
        rateLimit: RATE_LIMIT_60_PER_MIN, // Using 60 for test, actual is 30
      });

      const req = new NextRequest('http://localhost/api/v1/entity/projects/export');
      const params = { entity: 'projects' };

      const result = await routeHandler(req, { params });

      // Original pattern: resolved params -> createWrappedHandler -> withErrorHandling(withRateLimit(...))
      expect(handler).toHaveBeenCalledWith(req, { params: { entity: 'projects' } });
      expect(result.status).toBe(410);
    });
  });
});
