/** Note: Indirectly consumed via entity registry; allowlisted in unused-exports to avoid FP. */

'use client';
import { toColDef } from '@/lib/services/entities/adapters/aggrid';
import { ADDRESSES_COLUMNS } from '@/lib/services/entities/addresses/columns.config';
import type { EntityGridConfig } from '@/types/dashboard';
import type { ColDef } from 'ag-grid-community';
import { createDefaultColDef } from '../shared/ag-grid-config';
import { createEntityFetcher } from '../shared/grid/fetchers';

async function resolveColDefs(): Promise<ColDef[]> {
  // Map framework-agnostic columns → AG Grid ColDef (lazy formatters)
  const defs = await Promise.all(ADDRESSES_COLUMNS.map(toColDef));
  return defs;
}

export const addressesConfig: EntityGridConfig = {
  id: 'addresses',
  colDefs: resolveColDefs,
  defaultColDef: createDefaultColDef(),
  defaultSortModel: [{ colId: 'total_job_value', sort: 'desc' }],
  fetcher: createEntityFetcher('addresses'),
  ui: { rowHeight: 40, headerHeight: 40, groupHeaderHeight: 26 },
};



