// lib/server/feature-flags/resolvers.ts
import { getEnv } from '@/lib/server/env';
import 'server-only';

/**
 * Centralised resolver registry. Each feature flag that cannot be resolved through the
 * default config object **must** have an entry in this map. Keep this list short –
 * prefer using the declarative `buildFeatureFlags()` when possible.
 */
const RESOLVERS = {
  // Example percentage roll-out (dummy – replace with real rules)
  'ui.beta.newDashboard': (ctx?: { userId?: string }) => {
    // 10% roll-out gated by userId hash
    if (!ctx?.userId) return false;
    const hash = Array.from(ctx.userId).reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0);
    return hash % 10 === 0; // ~10%
  },
  // Example experiment variant flag – returns string variant
  'ui.beta.advancedCharts': (ctx?: { userId?: string }) => {
    if (!ctx?.userId) return 'control';
    const hash = Array.from(ctx.userId).reduce((acc: number, ch: string) => acc + ch.charCodeAt(0), 0);
    return hash % 2 === 0 ? 'variantA' : 'control';
  },
  // Environment-based override for prompt-guard (always on in prod)
  'security.promptGuardEnabled': () => getEnv().NODE_ENV === 'production' || getEnv().NEXT_PUBLIC_STAGE === 'preview',
};

/**
 * Generic flag checker that first looks for an explicit resolver in RESOLVERS.
 * If none exists, it falls back to the `isFeatureEnabled` helper from
 * `feature-flags.ts`, keeping backwards-compatibility.
 */
export async function isEnabled(flag: string, ctx?: { userId?: string }): Promise<boolean> {
  const resolver = RESOLVERS[flag as keyof typeof RESOLVERS];
  if (resolver) {
    const result = resolver(ctx);
    return typeof result === 'boolean' ? result : Boolean(result);
  }
  const { isFeatureEnabled } = await import('./feature-flags');
  return isFeatureEnabled(flag);
}

/**
 * Get the variant for an experiment flag.
 * If a resolver exists and returns a non-boolean primitive, that is treated as
 * the experiment variant. Otherwise, we coerce the result to a boolean and use
 * `'on' | 'off'` variants for convenience.
 */
export async function getVariant<T = string>(flag: string, ctx?: { userId?: string }): Promise<T> {
  const resolver = RESOLVERS[flag as keyof typeof RESOLVERS];
  if (resolver) {
    return resolver(ctx) as unknown as T;
  }
  const { getFeatureValue } = await import('./feature-flags');
  return (await getFeatureValue<T>(flag, 'off' as unknown as T)) as T;
}

