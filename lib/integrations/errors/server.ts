import 'server-only';

import { classifyError, toErrorPayload } from '@/lib/shared/errors/error-utils';

export async function reportError(error: unknown, context?: Record<string, unknown>) {
  const kind = classifyError(error);
  const payload = toErrorPayload(error);
  const event = { ...payload, context, kind };
  // TODO: wire vendor SDK (Sentry, etc.) here. For tests, no-op.
  return Promise.resolve(event);
}

