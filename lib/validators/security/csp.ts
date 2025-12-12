// lib/validators/security/csp.ts
import { z } from "zod";

/**
 * @public
 */
export const cspViolationBodySchema = z
  .object({
    "document-uri": z.string().url().optional(),
    referrer: z.string().optional(),
    "violated-directive": z.string(),
    "effective-directive": z.string().optional(),
    "original-policy": z.string().optional(),
    "blocked-uri": z.string().optional(),
    "status-code": z.number().int().optional(),
    "source-file": z.string().optional(),
    "line-number": z.number().int().optional(),
    "column-number": z.number().int().optional(),
    "script-sample": z.string().optional(),
    disposition: z.string().optional(),
    sample: z.string().optional(),
  })
  .strict();

/**
 * @public
 */
export const legacyCspReportSchema = z.object({
  "csp-report": cspViolationBodySchema,
}).strict();

const reportToItemSchema = z
  .object({
    type: z.string(), // usually "csp-violation"
    age: z.number().optional(),
    url: z.string().optional(),
    user_agent: z.string().optional(),
    // Accept unknown body; we'll validate per-item at runtime to allow mixed reports
    body: z.unknown(),
  })
  .strict();

/**
 * @public
 */
export const reportToBatchSchema = z.array(reportToItemSchema).min(1);

/**
 * @public
 */
export type CspViolation = z.infer<typeof cspViolationBodySchema>;

