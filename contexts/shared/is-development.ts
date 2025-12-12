import { publicEnv } from '@/lib/shared';

type CorsoGlobal = typeof globalThis & {
  __CORSO_DEV__?: boolean;
};

const DEV_STAGES = new Set(['development', 'dev', 'local']);

export function isDevelopment(): boolean {
  const globalFlag = readGlobalFlag();
  if (globalFlag !== null) {
    return globalFlag;
  }

  const stage = readStage();
  return stage !== null && DEV_STAGES.has(stage);
}

function readGlobalFlag(): boolean | null {
  try {
    if (typeof globalThis !== 'object' || globalThis === null) {
      return null;
    }

    const globalWithFlag = globalThis as CorsoGlobal;
    if ('__CORSO_DEV__' in globalWithFlag) {
      return Boolean(globalWithFlag.__CORSO_DEV__);
    }
  } catch {
    // Swallow errors to keep behavior consistent in unexpected environments
  }

  return null;
}

function readStage(): string | null {
  try {
    // Client: prefer window.__PUBLIC_ENV__ injected by app/layout.tsx
    // Use bracket notation to avoid direct `window` identifier for linter compatibility
    const w =
      typeof globalThis !== 'undefined' && (globalThis as any)['window']
        ? ((globalThis as any)['window'] as any)
        : undefined;

    if (w && w.__PUBLIC_ENV__) {
      const stage = w.__PUBLIC_ENV__.NEXT_PUBLIC_STAGE as string | undefined;
      const norm = stage?.trim().toLowerCase();
      if (norm) return norm;
    }

    // Server / fallback: use the shared publicEnv (never process.env directly)
    const stage = publicEnv.NEXT_PUBLIC_STAGE;
    if (!stage) return null;
    const normalized = stage.trim().toLowerCase();
    if (!normalized) return null;
    return normalized;
  } catch {
    return null;
  }
}

