import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

describe('AG Grid static import guard', () => {
  it('does not contain top-level ag-grid-enterprise string in register.ts', () => {
    const content = readFileSync(new URL('../../../lib/vendors/ag-grid/register.ts', import.meta.url), 'utf8');
    // allow dynamic import() but disallow plain string that suggests a top-level import
    const plain = /import\s+.*ag-grid-enterprise/;
    expect(plain.test(content)).toBe(false);
  });
});



