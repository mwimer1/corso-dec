// lib/monitoring/logger.ts
/**
 * Universal logger – now strict-TS & ESLint clean.
 *
 * • TS2314 fixed – constructor type `ALSCtor` carries the generic, not the
 *   instance. `AsyncLocalStorage<RequestContext>` instantiation stays valid.
 * • @typescript-eslint/consistent-type-imports respected – only `import type`.
 */

// Avoid importing server-only env helpers in this module to keep it client/edge-safe.
import type { AsyncLocalStorage as ALSInstance } from 'async_hooks';
import { createBaseLogger } from './base-logger';
import type { ContextStorage, RequestContext } from './base-logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Class-constructor type (generic captured here, so no TS2314 complaints)
type ALSCtor = new <T>() => ALSInstance<T>;

// ---------------------------------------------------------------------------
// Client-compatible AsyncLocalStorage shim
// ---------------------------------------------------------------------------
class ClientCompatibleStorage<T> implements ContextStorage<T> {
  private storage: T | undefined = undefined;

  run<R>(value: T, fn: () => R): R {
    const prev = this.storage;
    this.storage = value;
    try {
      return fn();
    } finally {
      this.storage = prev;
    }
  }

  getStore(): T | undefined {
    return this.storage;
  }
}

let contextStorage: ContextStorage<RequestContext>;

if (typeof window === 'undefined') {
  // Node.js: try real AsyncLocalStorage first
  try {
    const { AsyncLocalStorage } = require('async_hooks') as {
      AsyncLocalStorage: ALSCtor;
    };
    contextStorage = new AsyncLocalStorage<RequestContext>();
  } catch {
    contextStorage = new ClientCompatibleStorage<RequestContext>();
  }
} else {
  // Browser: shim
  contextStorage = new ClientCompatibleStorage<RequestContext>();
}

// ---------------------------------------------------------------------------
// Helper API
// ---------------------------------------------------------------------------
export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return contextStorage.run(context, fn);
}

// ---------------------------------------------------------------------------
// Logger factory
// ---------------------------------------------------------------------------

/** Singleton default logger (debug in dev, info in prod) */
// Use Edge-safe environment detection to keep this module client/edge-safe.
// Allowed: Direct process.env.NODE_ENV check for build-time optimization (dev vs prod logging levels).
const isProd = (typeof process !== 'undefined' ? process.env.NODE_ENV : undefined) === 'production';
export const logger = createBaseLogger({ level: isProd ? 'info' : 'debug' }, contextStorage);
