import { ContactSchema } from '@/lib/validators';
import { describe, expect, it } from 'vitest';

describe('ContactSchema', () => {
  it('parses a valid contact and narrows type', () => {
    const input = { name: 'Ada Lovelace', email: 'ada@example.com', company: 'ACME' };
    const parsed = ContactSchema.parse(input);
    expect(parsed.email).toBe('ada@example.com');
    expect(parsed.name).toBe('Ada Lovelace');
  });
});



