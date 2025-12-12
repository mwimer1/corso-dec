import { maskSensitiveData } from '@/lib/security/utils/masking';
import { describe, expect, it } from 'vitest';

describe('maskSensitiveData – userId vs userid variants', () => {
  it('distinguishes between safe userId and sensitive userid/user_id', () => {
    const input = {
      userId: 'safe-user-123',      // should NOT be masked
      userid: 'sensitive-456',      // should be masked
      user_id: 'also-sensitive-789' // should be masked
    };

    const masked = maskSensitiveData(input);

    expect(masked.userId).toBe('safe-user-123');
    expect(masked.userid).toBe('***MASKED***');
    expect(masked.user_id).toBe('***MASKED***');
  });

  it('still masks classic secrets and tokens', () => {
    const input = {
      token: 'shhh',
      api_key: 'key',
      authorization: 'Bearer abc',
      password: 'pw',
    };
    const masked = maskSensitiveData(input);
    expect(masked.token).toBe('***MASKED***');
    expect(masked.api_key).toBe('***MASKED***');
    expect(masked.authorization).toBe('***MASKED***');
    expect(masked.password).toBe('***MASKED***');
  });
});

