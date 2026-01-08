import { cspViolationBodySchema, legacyCspReportSchema } from '@/lib/validators/security/csp';
import { describe, expect, it } from 'vitest';

describe('CSP schemas', () => {
  it('parses minimal valid violation body', () => {
    const valid = { 'violated-directive': 'script-src' };
    const res = cspViolationBodySchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  it('rejects extra properties (strict)', () => {
    const invalid = { 'violated-directive': 'script-src', extra: true } as any;
    const res = cspViolationBodySchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  it('parses legacy wrapped report', () => {
    const body = { 'violated-directive': 'default-src' };
    const wrapped = { 'csp-report': body };
    const out = legacyCspReportSchema.safeParse(wrapped);
    expect(out.success).toBe(true);
  });
});



