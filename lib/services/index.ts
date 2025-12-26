// Client-safe exports only (no 'server-only' imports here)

// Types and interfaces
export * from './entities/contracts';
export * from './entities/types';

// Column configurations and utilities
export { ADDRESSES_COLUMNS } from './entities/addresses/columns.config';
export { COMPANIES_COLUMNS } from './entities/companies/columns.config';
export { PROJECTS_COLUMNS } from './entities/projects/columns.config';

// Entity services barrel exports (consolidated from entity/index.ts)
export { getEntityConfig, loadGridConfig } from './entities/config';
export type { GridConfig, GridId } from './entities/contracts';
export type { TableColumnConfig } from './entities/types';

// Re-export adapters for client-side use
export { toColDef } from './entities/adapters/aggrid';

// Column registry
export * from './entities/columns/registry';


