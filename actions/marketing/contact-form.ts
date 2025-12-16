"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { ApplicationError, ErrorCategory, ErrorSeverity, handleInternalError, handleValidationError, validateInput } from '@/lib/actions';
import { withRateLimit } from '@/lib/middleware/http/rate-limit';
import { buildCompositeKey, ACTION_RATE_LIMITS as RATE_LIMITS } from '@/lib/ratelimiting';
import { verifyTurnstileToken } from '@/lib/security/server';
import { ContactSchema as contactFormSchema } from '@/lib/validators';

/* ---------------- Schema & Types ---------------- */
type ContactFormData = z.infer<typeof contactFormSchema>;

/* ---------------- Server Action ---------------- */
export async function submitContactForm(
  data: ContactFormData & { turnstileToken?: string },
) {
  const h = await headers();
  const ip = h?.get?.("cf-connecting-ip") ?? "unknown";

  if (
    !data.turnstileToken ||
    !(await verifyTurnstileToken(data.turnstileToken, ip))
  ) {
    throw new ApplicationError({
      message: "Bot challenge failed",
      code: "BOT_VERIFICATION_FAILED",
      category: ErrorCategory.SECURITY,
      severity: ErrorSeverity.WARNING,
    });
  }

  // Enable rate limiting after bot verification (IP-scoped)
  await withRateLimit(
    buildCompositeKey('marketing:contact', ip),
    RATE_LIMITS['USER_ACTION']!,
  );

  try {
    validateInput(contactFormSchema, data, "contact form");

    // Note: Contact form submissions are not logged to maintain privacy

    // Removed artificial delay to improve performance and avoid unintended timeouts

    return { success: true, message: "Thank you! We'll be in touch soon." };
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw handleValidationError(err, "contact form");
    }
    if (err instanceof ApplicationError) throw err;
    throw handleInternalError(err, "contact form");
  }
}

