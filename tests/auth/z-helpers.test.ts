import { zBool01 } from '@/lib/validators';
import { describe, expect, it } from 'vitest';

describe('zBool01', () => {
  it('coerces 0/1 and "0"/"1" to boolean', () => {
    expect(zBool01.parse(0)).toBe(false);
    expect(zBool01.parse(1)).toBe(true);
    expect(zBool01.parse('0')).toBe(false);
    expect(zBool01.parse('1')).toBe(true);
    expect(zBool01.parse(false)).toBe(false);
    expect(zBool01.parse(true)).toBe(true);
  });
});


