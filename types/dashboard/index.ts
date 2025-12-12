// types/dashboard/index.ts
/**
 * Dashboard domain types - root barrel
 * Explicit exports for better tooling support
 */

// Analytics types
export type {
    AddressRow, BaseRow, CompanyRow, ProjectRow
} from './analytics/types';

// Entity grid types
export type {
    EntityFetchResult,
    EntityFetcher,
    GridId,
    ColDefsProvider,
    EntityGridConfig,
    EntityGridProps
} from '../entity-grid';

// Additional analytics types can be added here when needed


