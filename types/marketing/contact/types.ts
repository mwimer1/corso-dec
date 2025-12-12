/**
 * Contact form payload type definition
 * 
 * Note: Message field has validation constraints:
 * - Minimum: 10 characters
 * - Maximum: 2000 characters
 * 
 * See @/lib/marketing for runtime validation schema.
 */
export interface Contact {
  name: string;
  email: string;
  company?: string;
  /** Message content (10-2000 characters) */
  message: string;
}


