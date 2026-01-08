// lib/entities/config.ts
// Pure configuration loader - no deps on actions or loader.
import type { TableColumnConfig } from './types';
import type { GridConfig, GridId } from './contracts';

export async function loadGridConfig(gridId: GridId): Promise<GridConfig> {
  switch (gridId) {
    case 'projects': {
      const mod = await import('./projects/gridmap.config');
      return mod.default;
    }
    case 'companies': {
      const mod = await import('./companies/gridmap.config');
      return mod.default;
    }
    case 'addresses': {
      const mod = await import('./addresses/gridmap.config');
      return mod.default;
    }
    default:
      throw new Error(`Unknown grid id: ${gridId}`);
  }
}

// New function for framework-agnostic configs
export async function getEntityConfig(entity: string): Promise<TableColumnConfig[]> {
  // Return the full static column configurations for each entity
  switch (entity) {
    case 'projects': {
      const mod = await import('./projects/columns.config');
      return mod.PROJECTS_COLUMNS;
    }
    case 'companies': {
      const mod = await import('./companies/columns.config');
      return mod.COMPANIES_COLUMNS;
    }
    case 'addresses': {
      const mod = await import('./addresses/columns.config');
      return mod.ADDRESSES_COLUMNS;
    }
    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }
}


