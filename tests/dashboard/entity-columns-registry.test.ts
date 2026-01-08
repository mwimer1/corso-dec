import { ADDRESSES_COLUMNS, COMPANIES_COLUMNS, PROJECTS_COLUMNS } from '@/lib/services';
import { describe, expect, it } from 'vitest';

describe('Entity Columns', () => {
  it('exposes column configs for known entities', () => {
    expect(ADDRESSES_COLUMNS?.length).toBeGreaterThan(0);
    expect(COMPANIES_COLUMNS?.length).toBeGreaterThan(0);
    expect(PROJECTS_COLUMNS?.length).toBeGreaterThan(0);
  });
});

