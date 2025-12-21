'use client';
import { toColDef } from '@/lib/services/entity/adapters/aggrid';
import { PROJECTS_COLUMNS } from '@/lib/services/entity/projects/columns.config';
import type { EntityGridConfig } from '@/types/dashboard';
import type { ColDef } from 'ag-grid-community';
import { createDefaultColDef } from '../shared/ag-grid-config';
import { createEntityFetcher } from '../shared/grid/fetchers';

async function resolveColDefs(): Promise<ColDef[]> {
  // Map framework-agnostic columns → AG Grid ColDef (lazy formatters)
  const defs = await Promise.all(PROJECTS_COLUMNS.map(toColDef));
  return defs;
}

export const projectsConfig: EntityGridConfig = {
  id: 'projects',
  colDefs: resolveColDefs,
  defaultColDef: createDefaultColDef(),
  defaultSortModel: [{ colId: 'effective_date', sort: 'desc' }],
  fetcher: createEntityFetcher('projects'),
  ui: { rowHeight: 40, headerHeight: 40 },
};



