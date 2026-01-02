// Node.js required: Clerk webhook verification
/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';
/** @knipignore */
export const revalidate = 0;

import { http } from '@/lib/api';
import { handleOptions, withErrorHandlingNode, withRateLimitNode, RATE_LIMIT_100_PER_MIN } from '@/lib/middleware';
import { logger } from '@/lib/monitoring';
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

/**
 * Webhook handler for Clerk authentication events.
 * 
 * Safety notes:
 * - Raw body is read inside the handler (not in middleware) to preserve signature integrity
 * - Error handling wrapper (withErrorHandlingNode) does NOT read the body, so it's safe
 * - Rate limiting wrapper (withRateLimitNode) does NOT read the body, so it's safe
 * - Signature verification must use the exact raw body string as received
 */
const handler = async (req: NextRequest): Promise<Response> => {
  // Read raw body FIRST - must be done before any JSON parsing to preserve signature integrity
  // This is safe because middleware wrappers don't consume the request body
  const payload = await req.text();
  const headersMap = Object.fromEntries(req.headers) as Record<string, string | undefined>;
  const clerkSig = headersMap['clerk-signature'];

  const webhookSecret = getEnv().CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('Clerk webhook secret not configured');
    return http.error(500, 'Webhook secret not configured', { code: 'WEBHOOK_CONFIG_ERROR' });
  }

  const wh = new Webhook(webhookSecret);

  try {
    // Verify signature using raw payload - this is critical for security
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

    // Validate event envelope structure
    const envelope = ClerkEventEnvelope.parse({
      type: (evt as any).type,
      object: (evt as any).object,
      id: (evt as any).id,
    });

    // Log successful webhook processing (without sensitive data)
    logger.info('Clerk webhook processed', {
      eventType: envelope.type,
      eventObject: envelope.object,
      eventId: envelope.id,
    });

    return http.noContent();
  } catch (error) {
    // Distinguish between signature errors and validation errors for better debugging
    if (error instanceof z.ZodError) {
      logger.warn('Clerk webhook validation failed', {
        error: error.errors,
        hasSignature: !!clerkSig || !!(headersMap['svix-id'] && headersMap['svix-signature']),
      });
      return http.badRequest('Invalid webhook payload', { code: 'INVALID_WEBHOOK_PAYLOAD' });
    }

    // Signature verification failed
    logger.warn('Clerk webhook signature verification failed', {
      hasClerkSignature: !!clerkSig,
      hasSvixHeaders: !!(headersMap['svix-id'] && headersMap['svix-signature']),
    });
    return http.badRequest('Invalid webhook signature', { code: 'INVALID_WEBHOOK_SIGNATURE' });
  }
};

export const POST = withErrorHandlingNode(
  withRateLimitNode(async (req: NextRequest) => handler(req) as any, RATE_LIMIT_100_PER_MIN)
);

/** @knipignore */
export async function OPTIONS(req: Request) {
  return handleOptions(req);
}
