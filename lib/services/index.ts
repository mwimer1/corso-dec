// Client-safe exports only (no 'server-only' imports here)

// Types and interfaces
export * from './entity/contracts';
export * from './entity/types';

// Column configurations and utilities
export { ADDRESSES_COLUMNS } from './entity/addresses/columns.config';
export { COMPANIES_COLUMNS } from './entity/companies/columns.config';
export { PROJECTS_COLUMNS } from './entity/projects/columns.config';

// Entity services barrel exports (consolidated from entity/index.ts)
export type { TableColumnConfig } from './entity/types';
export { getEntityConfig, loadGridConfig } from './entity/config';
export type { GridConfig, GridId } from './entity/contracts';
export { createEntityFetchData } from './entity/loader';

// Re-export adapters for client-side use
export { toColDef } from './entity/adapters/aggrid';

// Column registry
export * from './entity/columns/registry';


