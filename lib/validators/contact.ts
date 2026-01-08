// lib/validators/contact.ts
import { z } from 'zod';

/**
 * Contact form validation used by public contact page.
 * Tests treat `message` as optional, so we accept its absence.
 * @public
 */
export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email format'),
  company: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message is too long').optional(),
}).strict();


