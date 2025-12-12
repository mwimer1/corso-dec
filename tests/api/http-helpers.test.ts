// tests/lib/api/http-helpers.test.ts
import { http } from '@/lib/api/response/http';
import { describe, expect, it } from 'vitest';

describe('http helpers', () => {
	it('ok wraps payload', async () => {
		const res = http.ok({ foo: 'bar' });
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body).toEqual({ success: true, data: { foo: 'bar' } });
	});

	it('badRequest returns structured error', async () => {
		const res = http.badRequest('Invalid', { details: { path: 'name' } });
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.error).toMatchObject({ message: 'Invalid', code: 'VALIDATION_ERROR' });
	});
});

