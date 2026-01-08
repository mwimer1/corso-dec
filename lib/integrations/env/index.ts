// Runtime-safe env helpers. No env reads at module scope.
import { z } from 'zod';

export function getEnv<K extends string>(keys: readonly K[]): Record<K, string | undefined> {
  const out = {} as Record<K, string | undefined>;
  for (const k of keys) {
    out[k] = (globalThis as any)?.process?.env?.[k];
  }
  return out;
}

export function requireServerEnv<K extends string>(keys: readonly K[]): Record<K, string> {
  // Validate env at call-time to avoid module-scope reads
  const raw = getEnv(keys);
  const shape = keys.reduce((acc, k) => ({ ...acc, [k]: z.string().min(1) }), {} as Record<K, z.ZodString>);
  const schema = z.object(shape).strict();
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const details = parsed.error.flatten().fieldErrors;
    throw new Error(JSON.stringify({ code: 'ENV_VALIDATION_FAILED', message: 'Missing/invalid server env', details }));
  }
  return parsed.data as Record<K, string>;
}

export function getEnvEdge<K extends string>(keys: readonly K[]): Record<K, string | undefined> {
  // Edge functions may have limited env; keep it lazy/safe.
  return getEnv(keys);
}

export function getPublicEnv<T extends string>(keys: readonly T[]): Record<T, string | undefined> {
  // For NEXT_PUBLIC_* only — still lazy
  return getEnv(keys as unknown as readonly string[] ) as Record<T, string | undefined>;
}

// Keep helper internal — do not export as part of the public API to avoid
// accidental deep imports. Consumers should import specific functions above.
export default { getEnv, requireServerEnv, getEnvEdge, getPublicEnv };



