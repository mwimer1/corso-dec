// lib/monitoring/logger-edge.ts
// Edge-safe logger and request context utilities (no async_hooks, no require)

import { createBaseLogger } from './base-logger';
import type { ContextStorage, RequestContext } from './base-logger';

class InMemoryStorage<T> implements ContextStorage<T> {
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

const contextStorage: ContextStorage<RequestContext> = new InMemoryStorage<RequestContext>();

export function runWithRequestContext<T>(context: RequestContext, fn: () => T): T {
  return contextStorage.run(context, fn);
}

// In Edge/browser default to debug off (info)
export const logger = createBaseLogger({ level: 'info' }, contextStorage);
