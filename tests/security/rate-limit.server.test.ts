// tests/lib/ratelimiting/rate-limit.server.test.ts
import { createMemoryStore } from '@/lib/ratelimiting';
import { checkRateLimit } from '@/lib/ratelimiting';
import { describe, expect, it } from 'vitest';

function key(...parts: string[]) {
	return parts.filter(Boolean).join(':');
}

describe('server rate limit (core)', () => {
	it('under limit does not limit', async () => {
		const store = createMemoryStore();
		const limited = await checkRateLimit(store, key('test', 'u1', '1.2.3.4'), { windowMs: 60_000, maxRequests: 100 });
		expect(limited).toBe(false);
	});

	it('exceeded returns limited=true', async () => {
		const store = createMemoryStore();
		const k = key('test', 'u2', '9.9.9.9');
		const limited = await checkRateLimit(store, k, { windowMs: 60_000, maxRequests: 0 });
		expect(limited).toBe(true);
	});
});

