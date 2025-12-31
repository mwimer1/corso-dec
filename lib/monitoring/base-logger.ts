// lib/monitoring/base-logger.ts
/**
 * Base logger implementation with shared formatter and logger factory
 * Provides common logging functionality for both Node and Edge runtimes
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  namespace?: string;
  level: LogLevel;
}

export type RequestContext = { requestId: string };

export interface ContextStorage<T> {
  run<R>(value: T, fn: () => R): R;
  getStore(): T | undefined;
}

/**
 * Shared formatter function
 */
function formatLogEntry(scope: string | undefined, level: LogLevel, args: unknown[], contextStorage: ContextStorage<RequestContext>): void {
  const ctx = contextStorage.getStore();
  const stamp = new Date().toISOString();

  let message = [scope ? `[${scope}]` : '', ...args]
    .filter(Boolean)
    .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
    .join(' ');

  // Prefix info logs with hit: [req:requestId] if present
  if (level === 'info' && ctx?.requestId) {
    message = `hit: [req:${ctx.requestId}] ${message}`;
  }

  const log = {
    timestamp: stamp,
    level,
    msg: message,
    requestId: ctx?.requestId ?? '',
  };

  // Use console for universal compatibility (Edge/Browser/Node)
  try {
    const line = `${JSON.stringify(log)}`;
    if (typeof console !== 'undefined') {
      if (level === 'error' && console.error) console.error(line);
      else if (level === 'warn' && console.warn) console.warn(line);
      else if (level === 'debug' && console.debug) console.debug(line);
      else if (console.log) console.log(line);
    }
  } catch {
    // no-op
  }
}

/**
 * Create a logger instance with shared functionality
 */
export function createBaseLogger(config: LogConfig, contextStorage: ContextStorage<RequestContext>) {
  return {
    debug: (...m: unknown[]) => {
      if (config.level === 'debug') formatLogEntry(config.namespace, 'debug', m, contextStorage);
    },
    info: (...m: unknown[]) => formatLogEntry(config.namespace, 'info', m, contextStorage),
    warn: (...m: unknown[]) => formatLogEntry(config.namespace, 'warn', m, contextStorage),
    error: (...m: unknown[]) => formatLogEntry(config.namespace, 'error', m, contextStorage),
  };
}
