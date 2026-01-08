import { z } from "zod";

/**
 * Clerk event envelope - matches the full webhook payload structure
 */
export const ClerkEventEnvelope = z.object({
  id: z.string().optional(),
  type: z.string(),
  data: z.unknown(),
  object: z.literal("event"),
}).strict();

/**
 * Clerk user payload schema for user events
 */
export const ClerkUserPayload = z.object({
  id: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email_addresses: z.array(z.object({
    email_address: z.string().email(),
    id: z.string().optional(),
  })).optional(),
  username: z.string().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
}).strict();


