import { PublicEnvSchema } from '@/lib/validators/public-env';
import { describe, expect, it } from 'vitest';

describe('PublicEnvSchema', () => {
  it('parses enterprise flag values and license key requirement', () => {
    const ok = PublicEnvSchema.safeParse({ NEXT_PUBLIC_AGGRID_ENTERPRISE: 'true', NEXT_PUBLIC_AGGRID_LICENSE_KEY: 'abc' });
    expect(ok.success).toBe(true);
    const bad = PublicEnvSchema.safeParse({ NEXT_PUBLIC_AGGRID_ENTERPRISE: 'true', NEXT_PUBLIC_AGGRID_LICENSE_KEY: '' });
    expect(bad.success).toBe(false);
  });

  it('rejects non-booleanish values', () => {
    const res = PublicEnvSchema.safeParse({ NEXT_PUBLIC_AGGRID_ENTERPRISE: 'yes' as any });
    expect(res.success).toBe(false);
  });
});



