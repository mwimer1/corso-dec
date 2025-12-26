# Dashboard Entity Components

## Purpose

Entity grid system for dashboard data tables (projects, addresses, companies). Provides a unified AG Grid-based interface with server-side row model, filtering, sorting, and pagination.

## Key Files

- `index.ts` - Registry and exports (`EntityGrid`, `EntityGridHost`, `getEntityConfig`)
- `shared/grid/entity-grid.tsx` - Core grid component with AG Grid integration
- `shared/grid/entity-grid-host.tsx` - Client wrapper for grid hydration
- `{entity}/config.ts` - Per-entity configuration (columns, fetchers)

## Usage

```tsx
import { EntityGridHost, getEntityConfig } from '@/components/dashboard/entities';

const config = getEntityConfig('projects');
<EntityGridHost config={config} />
```

## Architecture

- **Framework-agnostic columns**: Column definitions use `TableColumnConfig` schema in `lib/services/entities/<entity>/columns.config.ts`
- **Server-side pagination**: All data fetched via `/api/v1/entity/{entity}` with query params
- **Type-safe registry**: Entity types validated via Zod in route handlers

## Client/Server Notes

- `EntityGridHost` is a client component (required for AG Grid)
- Grid configuration and fetchers are server-safe
- Column definitions are framework-agnostic and adapt to AG Grid via `toColDef()` adapter
