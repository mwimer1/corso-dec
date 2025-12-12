// lib/validators/shared/primitives.ts
import { z } from 'zod';

/**
 * Primitive validation schemas used across multiple domains.
 * These are the foundational schemas that enforce business rules
 * for common input types like emails, passwords, and names.
 */

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')
  .max(255, 'Email is too long')
  .toLowerCase()
  .refine((e) => !e.includes('+'), {
    message: 'Email aliases with + are not allowed for security',
  });

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')
  .regex(/^[a-zA-Z\s\-'.]+$/, 'Name contains invalid characters')
  .transform((n) => n.trim())
  .refine((n) => n.length > 0, { message: 'Name cannot be empty after trimming' });




