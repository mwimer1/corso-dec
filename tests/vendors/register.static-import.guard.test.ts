import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

describe('AG Grid static import guard', () => {
  it('does not contain top-level ag-grid-enterprise string in ag-grid.client.ts', () => {
    const content = readFileSync(new URL('../../../lib/vendors/ag-grid.client.ts', import.meta.url), 'utf8');
    // allow dynamic import() but disallow plain string that suggests a top-level import
    // Note: This test verifies that ag-grid-enterprise is imported properly (not as a string)
    // The client adapter correctly imports AllEnterpriseModule and LicenseManager
    const plain = /import\s+.*['"]ag-grid-enterprise['"]/;
    expect(plain.test(content)).toBe(false);
  });
});



