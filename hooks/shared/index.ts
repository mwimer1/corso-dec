import * as React from 'react';

// --- shared UI hooks ---
export * from './ui/use-arrow-key-navigation';

// --- cross-cutting root hook(s) ---
export * from './use-subscription-status';

// --- lightweight shared types used by data hooks ---
export type QueryOpts<_TArgs = Record<string, unknown>, TData = unknown> = {
  enabled?: boolean;
  initialData?: TData;
  cacheKey?: (string | number)[];
};

// --- generic factory for simple data hooks ---
export function createWarehouseQueryHook<
  TArgs extends Record<string, unknown>,
  TData
>(cfg: {
  fetcher: (args: TArgs) => Promise<TData>;
  makeKey: (args: TArgs) => readonly (string | number)[];
  staleTime?: number;
  autoLimit?: boolean;
}) {
  return function useWarehouseQuery(args: TArgs, opts?: QueryOpts<TArgs, TData>) {
    const [data, setData] = React.useState<TData | undefined>(opts?.initialData);
    const [error, setError] = React.useState<unknown>();
    const [loading, setLoading] = React.useState<boolean>(opts?.enabled === false ? false : true);
    const key = React.useMemo(() => cfg.makeKey(args).join('::'), [args]);

    React.useEffect(() => {
      const enabled = opts?.enabled ?? true;
      if (!enabled) return;
      let alive = true;
      setLoading(true);
      cfg
        .fetcher(args)
        .then((res) => alive && setData(res))
        .catch((e) => alive && setError(e))
        .finally(() => alive && setLoading(false));
      return () => {
        alive = false;
      };
    }, [key, opts?.enabled, args]);

    return { data, error, isLoading: loading } as const;
  };
}

// --- streaming fetch for SSE-ish endpoints (e.g., AI gen) ---
function useStreamingFetch() {
  const [controller, setController] = React.useState<AbortController | null>(null);

  React.useEffect(() => {
    const newController = new AbortController();
    setController(newController);
    return () => {
      newController.abort();
    };
  }, []);

  const getController = React.useCallback(() => {
    if (!controller) {
      return new AbortController();
    }
    return controller;
  }, [controller]);

  const streamingFetch = React.useCallback(
    async (url: string, options: RequestInit & { errorPrefix?: string } = {}) => {
      const { errorPrefix, ...fetchOptions } = options;
      let processed = { ...fetchOptions };
      if (processed.body && typeof processed.body === 'object' && !(processed.body instanceof FormData)) {
        processed = {
          ...processed,
          body: JSON.stringify(processed.body),
          headers: { 'Content-Type': 'application/json', ...(processed.headers ?? {}) }
        };
      }
      const response = await fetch(url, {
        ...processed,
        ...(controller?.signal ? { signal: controller.signal } : {})
      });
      if (!response.ok) throw new Error(`${errorPrefix || 'Request failed'}: ${response.status} ${response.statusText}`);
      if (!response.body) throw new Error(`${errorPrefix || 'Request failed'}: No response body`);

      async function* processStream(): AsyncGenerator<any, void, unknown> {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n');
            buffer = parts.pop() ?? '';
            for (const line of parts) {
              const trimmed = line.trim();
              if (!trimmed) continue;
              try { yield JSON.parse(trimmed); } catch {}
            }
          }
          if (buffer.trim()) {
            try { yield JSON.parse(buffer); } catch {}
          }
        } finally {
          reader.releaseLock();
        }
      }
      return { stream: processStream() };
    },
    [controller]
  );

  return { streamingFetch, getController };
}

export { useStreamingFetch };

