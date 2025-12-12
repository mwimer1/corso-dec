/**
 * Runtime detection with zero Node-only imports.
 */

declare const EdgeRuntime: string | undefined;

export type NextRuntime = 'edge' | 'nodejs';

export function currentRuntime(): NextRuntime {
  const v =
    typeof process !== 'undefined'
      ? (process.env as Record<string, string | undefined>)?.['NEXT_RUNTIME'] as NextRuntime | undefined
      : undefined;

  if (v === 'edge' || v === 'nodejs') return v;
  // Heuristic: Edge defines the EdgeRuntime global
  return typeof EdgeRuntime !== 'undefined' ? 'edge' : 'nodejs';
}

export const isEdge = () => currentRuntime() === 'edge';
export const isNode = () => !isEdge();



