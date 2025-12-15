// lib/validators/auth/user-validation.ts
import { z } from 'zod';
import { emailSchema, nameSchema } from '@/lib/validators/shared/primitives';

/**
 * Runtime validation for a user profile.
 * @public
 * Feel free to extend fields later, but keep core ones typed.
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  name: nameSchema,
  avatarUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
}).strict();

// UserPayload type removed - not used anywhere

