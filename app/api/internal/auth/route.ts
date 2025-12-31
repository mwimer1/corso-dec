// Node.js required: Clerk webhook verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { http } from '@/lib/api';
import { handleCors, withErrorHandlingNode, withRateLimitNode, RATE_LIMIT_100_PER_MIN } from '@/lib/middleware';
import { getEnv } from '@/lib/server/env';
import { ClerkEventEnvelope } from '@/lib/validators/clerk-webhook';
import type { NextRequest } from 'next/server';
import type { WebhookRequiredHeaders } from 'svix';
import { Webhook } from 'svix';
import { z } from 'zod';

const SvixHeaderSchema = z
  .object({
    'svix-id': z.string(),
    'svix-timestamp': z.string(),
    'svix-signature': z.string(),
  })
  .strict();

const handler = async (req: NextRequest): Promise<Response> => {
  const payload = await req.text();
  const headersMap = Object.fromEntries(req.headers) as Record<string, string | undefined>;
  const clerkSig = headersMap['clerk-signature'];

  const wh = new Webhook(getEnv().CLERK_WEBHOOK_SECRET || '');

  try {
    const evt = clerkSig
      ? wh.verify(payload, { 'clerk-signature': clerkSig } as Record<string, string>)
      : wh.verify(
          payload,
          SvixHeaderSchema.parse({
            'svix-id': headersMap['svix-id'],
            'svix-timestamp': headersMap['svix-timestamp'],
            'svix-signature': headersMap['svix-signature'],
          }) as WebhookRequiredHeaders
        );
    // minimal validation; id may be absent in "minimal envelope" test
    ClerkEventEnvelope.parse({ type: (evt as any).type, object: (evt as any).object, id: (evt as any).id });
    return http.noContent();
  } catch {
    return http.badRequest('Invalid webhook signature', { code: 'INVALID_WEBHOOK_SIGNATURE' });
  }
};

export const POST = withErrorHandlingNode(
  withRateLimitNode(async (req: NextRequest) => handler(req) as any, RATE_LIMIT_100_PER_MIN)
);

export async function OPTIONS(req: Request) {
  const response = handleCors(req);
  if (response) return response;
  return http.noContent();
}
