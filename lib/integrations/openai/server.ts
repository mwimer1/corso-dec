import { getEnv, requireServerEnv } from '@/lib/server/env';
import { getKnobInt } from '@/lib/server/env/knobs';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import OpenAI from 'openai';
import 'server-only';

type OpenAIClientOptions = ConstructorParameters<typeof OpenAI>[0];

let _singleton: OpenAI | null = null;

export function createOpenAIClient(
  opts: OpenAIClientOptions = {},
): OpenAI {
  const apiKey = opts.apiKey ?? requireServerEnv('OPENAI_API_KEY').OPENAI_API_KEY;
  if (!apiKey) {
    throw new ApplicationError({
      code: 'OPENAI_API_KEY_MISSING',
      message: 'OPENAI_API_KEY is not defined',
      category: ErrorCategory.INTERNAL,
      severity: ErrorSeverity.ERROR,
    });
  }

  // Ensure apiKey is a string (TypeScript type narrowing)
  const apiKeyString = typeof apiKey === 'string' ? apiKey : String(apiKey);

  const env = getEnv();
  const orgId = env.OPENAI_ORG_ID;
  const baseConfig: OpenAIClientOptions & { apiKey: string } = orgId
    ? { apiKey: apiKeyString, organization: orgId }
    : { apiKey: apiKeyString };
  // Apply global timeout and retry settings if provided
  if (typeof env.OPENAI_TIMEOUT === 'number') {
    (baseConfig as any).timeout = env.OPENAI_TIMEOUT;
  }
  if (typeof env.OPENAI_MAX_RETRIES === 'number') {
    (baseConfig as any).maxRetries = env.OPENAI_MAX_RETRIES as unknown as number;
  }
  if (Object.keys(opts).length > 0) {
    return new OpenAI({ ...baseConfig, ...opts });
  }

  if (!_singleton) {
    _singleton = new OpenAI(baseConfig);
  }
  return _singleton;
}

{ OpenAI };

/* ------------------------------------------------------------------ */
/* Utility functions from openai-utils.server.ts                     */
/* ------------------------------------------------------------------ */

type Retryable = {
  status?: number;
  name?: string;
  message?: string;
};

function shouldRetry(e: Retryable): boolean {
  const s = e.status ?? 0;
  if (s === 429) return true;
  if (s >= 500 && s < 600) return true;
  const n = (e.name || '').toLowerCase();
  return n.includes('timeout') || n.includes('abort') || n.includes('fetcherror');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function withTimeout(parent: AbortSignal | undefined, ms: number) {
  const controller = new AbortController();
  const onAbort = () => controller.abort('parent-aborted');
  if (parent) {
    if (parent.aborted) controller.abort('parent-aborted');
    else parent.addEventListener('abort', onAbort, { once: true });
  }
  const t = setTimeout(() => controller.abort('timeout'), ms);
  const cleanup = () => {
    clearTimeout(t);
    if (parent) parent.removeEventListener('abort', onAbort);
  };
  return { controller, cleanup };
}

interface CallJSONOpts<T> {
  op: 'sql' | 'chart' | (string & {});
  makeRequest: (client: OpenAI, signal: AbortSignal) => Promise<unknown>;
  parse: (raw: unknown) => T;
  parentSignal?: AbortSignal;
}

export async function callOpenAIJSON<T>(opts: CallJSONOpts<T>): Promise<T> {
  const { op, makeRequest, parse, parentSignal } = opts;
  const env = getEnv();
  const timeoutMs = getKnobInt(env.OPENAI_TIMEOUT, 120000);
  const maxRetries = getKnobInt(env.OPENAI_MAX_RETRIES, 1);
  const slowMs = getKnobInt(env.OPENAI_SLOW_THRESHOLD_MS, 2000);

  const client = createOpenAIClient();
  let attempt = 0;
  const startAll = Date.now();

  while (true) {
    attempt++;
    const { controller, cleanup } = withTimeout(parentSignal, timeoutMs);
    const started = Date.now();
    try {
      const raw = await makeRequest(client, controller.signal);
      const dur = Date.now() - started;
      if (dur >= slowMs) {
        console.warn(`[OpenAI][slow] op=${op} dur=${dur}ms attempt=${attempt}`);
      }
      return parse(raw);
    } catch (e: unknown) {
      cleanup();
      const dur = Date.now() - started;
      if (attempt > maxRetries || !shouldRetry(e as Retryable)) {
        (e as Error & { meta?: Record<string, unknown> }).meta = { op, attempt, dur, total: Date.now() - startAll };
        throw e;
      }
      await sleep(500 * attempt);
      continue;
    } finally {
      cleanup();
    }
  }
}




