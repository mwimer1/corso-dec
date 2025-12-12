// lib/services/entity/config.ts
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
  // For now, return a basic config - in production this would be loaded from DB/files
  // This is a placeholder that will be expanded based on the actual entity configs
  const baseConfig: TableColumnConfig[] = [
    {
      id: 'name',
      label: 'Name',
      accessor: 'name',
      sortable: true,
      hidden: false,
    },
    {
      id: 'status',
      label: 'Status',
      accessor: 'status',
      sortable: true,
      hidden: false,
      format: 'text',
    },
    {
      id: 'created_at',
      label: 'Created',
      accessor: 'created_at',
      sortable: true,
      hidden: false,
      format: 'date',
    },
  ];

  // Entity-specific overrides would go here
  switch (entity) {
    case 'projects':
      return [
        ...baseConfig,
        {
          id: 'value',
          label: 'Value',
          accessor: 'value',
          sortable: true,
          hidden: false,
          format: 'currency',
        },
      ];
    case 'companies':
      return [
        ...baseConfig,
        {
          id: 'website',
          label: 'Website',
          accessor: 'website',
          sortable: false,
          hidden: false,
          format: 'link',
        },
      ];
    case 'addresses':
      return [
        ...baseConfig,
        {
          id: 'coordinates',
          label: 'Coordinates',
          accessor: 'coordinates',
          sortable: false,
          hidden: false,
          format: 'text',
        },
      ];
    default:
      return baseConfig;
  }
}


