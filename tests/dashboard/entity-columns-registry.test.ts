import { ADDRESSES_COLUMNS } from '@/lib/entities/addresses/columns.config';
import { COMPANIES_COLUMNS } from '@/lib/entities/companies/columns.config';
import { PROJECTS_COLUMNS } from '@/lib/entities/projects/columns.config';
import { describe, expect, it } from 'vitest';

describe('Entity Columns', () => {
  it('exposes column configs for known entities', () => {
    expect(ADDRESSES_COLUMNS?.length).toBeGreaterThan(0);
    expect(COMPANIES_COLUMNS?.length).toBeGreaterThan(0);
    expect(PROJECTS_COLUMNS?.length).toBeGreaterThan(0);
  });
});

