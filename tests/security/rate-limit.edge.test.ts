// tests/lib/ratelimiting/rate-limit.edge.test.ts
import { withRateLimitEdge } from '@/lib/middleware/edge/rate-limit';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

function makeReq(ip: string, path = 'https://app.local/api/health') {
	const headers = new Headers();
	headers.set('x-forwarded-for', ip);
	return new NextRequest(path, { headers });
}

describe('withRateLimitEdge', () => {
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
			maxRequests: 0,
		});
		const res = await handler(makeReq('9.9.9.9'));
		expect(res.status).toBe(429);
		expect(res.headers.get('Retry-After')).toBeTruthy();
		const body = await res.json();
		expect(body).toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } });
	});
});

