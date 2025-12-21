'use client';
import { toColDef } from '@/lib/services/entity/adapters/aggrid';
import { COMPANIES_COLUMNS } from '@/lib/services/entity/companies/columns.config';
import type { ColDef } from 'ag-grid-community';
import { createDefaultColDef } from '../shared/ag-grid-config';
import { createEntityFetcher } from '../shared/grid/fetchers';
import type { EntityGridConfig } from '@/types/dashboard';

async function resolveColDefs(): Promise<ColDef[]> {
  // Map framework-agnostic columns → AG Grid ColDef (lazy formatters)
  const defs = await Promise.all(COMPANIES_COLUMNS.map(toColDef));
  return defs;
}

export const companiesConfig: EntityGridConfig = {
  id: 'companies',
  colDefs: resolveColDefs,
  defaultColDef: createDefaultColDef(),
  defaultSortModel: [{ colId: 'job_value_ttm', sort: 'desc' }],
  fetcher: createEntityFetcher('companies'),
  ui: { rowHeight: 40, headerHeight: 40 },
};



