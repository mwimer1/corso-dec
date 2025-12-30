// tests/lib/ratelimiting/rate-limit.edge.test.ts
import { withRateLimitEdge } from '@/lib/middleware/edge/rate-limit';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock getEnvEdge to ensure test environment
vi.mock('@/lib/api/edge-env', () => ({
  getEnvEdge: () => ({
    NODE_ENV: 'test',
    DISABLE_RATE_LIMIT: undefined,
  }),
}));

function makeReq(ip: string, path = 'https://app.local/api/health', userId?: string): NextRequest {
  const headers = new Headers();
  headers.set('x-forwarded-for', ip);
  if (userId) {
    headers.set('x-clerk-user-id', userId);
  }
  return new NextRequest(path, { headers });
}

describe('withRateLimitEdge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('under limit passes through with 200', async () => {
    const handler = withRateLimitEdge(async () => new Response('ok', { status: 200 }), {
      windowMs: 60_000,
      maxRequests: 100,
    });
    const res = await handler(makeReq('1.2.3.4'));
    expect(res.status).toBe(200);
  });

  it('exceeded returns 429 with structured error', async () => {
    const handler = withRateLimitEdge(async () => new Response('ok', { status: 200 }), {
      windowMs: 60_000,
      maxRequests: 0, // Immediately rate limited
    });
    const res = await handler(makeReq('9.9.9.9'));
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } });
  });

  it('tracks requests and enforces limit after threshold', async () => {
    // Use a small limit to test counting behavior deterministically
    const handler = withRateLimitEdge(async () => new Response('ok', { status: 200 }), {
      windowMs: 60_000,
      maxRequests: 2, // Allow 2 requests, then limit
    });

    const req = makeReq('10.10.10.10', 'https://app.local/api/test');

    // First request should pass
    const res1 = await handler(req);
    expect(res1.status).toBe(200);

    // Second request should pass
    const res2 = await handler(req);
    expect(res2.status).toBe(200);

    // Third request should be rate limited
    const res3 = await handler(req);
    expect(res3.status).toBe(429);
    const body = await res3.json();
    expect(body).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } });
  });

  it('tracks rate limits per unique key (user + IP + path)', async () => {
    const handler = withRateLimitEdge(async () => new Response('ok', { status: 200 }), {
      windowMs: 60_000,
      maxRequests: 1, // Very low limit for testing
    });

    // Different IPs should have separate rate limit buckets
    const req1 = makeReq('1.1.1.1', 'https://app.local/api/test1');
    const req2 = makeReq('2.2.2.2', 'https://app.local/api/test2');

    // Both should succeed (different keys)
    const res1 = await handler(req1);
    const res2 = await handler(req2);
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    // Second request from same IP should be limited
    const res3 = await handler(req1);
    expect(res3.status).toBe(429);
  });

  it('includes Retry-After header with correct TTL', async () => {
    const handler = withRateLimitEdge(async () => new Response('ok', { status: 200 }), {
      windowMs: 60_000,
      maxRequests: 0, // Immediately rate limited
    });
    const res = await handler(makeReq('11.11.11.11'));
    expect(res.status).toBe(429);
    const retryAfter = res.headers.get('Retry-After');
    expect(retryAfter).toBeTruthy();
    const retrySeconds = Number.parseInt(retryAfter || '0', 10);
    // Should be approximately 60 seconds (windowMs / 1000)
    expect(retrySeconds).toBeGreaterThan(0);
    expect(retrySeconds).toBeLessThanOrEqual(60);
  });
});
