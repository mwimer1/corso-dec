// tests/lib/shared/env/env-validation.test.ts
import { getEnv, requireServerEnv } from '@/lib/integrations/env';
import { describe, expect, it } from 'vitest';

describe('env contract', () => {
	it('requireServerEnv throws for missing var', () => {
		expect(() => requireServerEnv('NON_EXISTENT_ENV_VAR')).toThrow();
	});

	it('getEnv returns only public keys in browser', () => {
		const oldWin = (global as any).window;
		(global as any).window = {};
		const env = getEnv();
		// Spot-check a known private var should be undefined; public may exist or be undefined
		expect((env as any).STRIPE_SECRET_KEY).toBeUndefined();
		(global as any).window = oldWin;
	});
});

