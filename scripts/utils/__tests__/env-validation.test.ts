// scripts/utils/__tests__/env-validation.test.ts
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { getEnv, requireServerEnv, runConsolidatedValidation } from '../env/validation';

const withEnv = (vars: Record<string, string | undefined>, fn: () => void) => {
  const prev: Record<string, string | undefined> = {};
  for (const k of Object.keys(vars)) prev[k] = process.env[k];
  try {
    for (const [k, v] of Object.entries(vars)) {
      if (typeof v === 'undefined') delete process.env[k];
      else process.env[k] = v;
    }
    fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (typeof v === 'undefined') delete process.env[k];
      else process.env[k] = v;
    }
  }
};

describe('env validation', () => {
  const shape = {
    NODE_ENV: z.enum(['development', 'test', 'production']),
    API_URL: z.string().url(),
  } as const;

  it('getEnv: ok', () => {
    withEnv(
      { NODE_ENV: 'test', API_URL: 'https://example.com' },
      () => {
        const res = getEnv(shape);
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.data.NODE_ENV).toBe('test');
          expect(res.data.API_URL).toBe('https://example.com');
        }
      }
    );
  });

  it('getEnv: invalid', () => {
    withEnv({ NODE_ENV: 'dev', API_URL: 'not-a-url' }, () => {
      const res = getEnv(shape);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('ENV_VALIDATION_FAILED');
        expect(res.error.details.length).toBeGreaterThan(0);
      }
    });
  });

  it('requireServerEnv: throws on invalid', () => {
    withEnv({ NODE_ENV: 'production', API_URL: undefined }, () => {
      expect(() => requireServerEnv(shape)).toThrowError();
    });
  });

  it('runConsolidatedValidation executes without throwing', async () => {
    await expect(runConsolidatedValidation()).resolves.not.toThrow();
  });
});

