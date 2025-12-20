# Entity Grid Components

Standardized AG Grid Enterprise implementation for entity management (projects, companies, addresses) with server-side row model (SSRM).

## Architecture Overview

Entity grids follow a standardized architecture pattern:

```
[entity]/page.tsx
  ↓ getEntityConfig()
registry (components/dashboard/entity/index.ts)
  ↓
EntityGridHost (shared/grid/entity-grid-host.tsx)
  ↓ config prop
EntityGrid (shared/grid/entity-grid.tsx)
  ↓ config.fetcher()
createEntityFetcher() (shared/grid/fetchers.ts)
  ↓ GET /api/v1/entity/{entity}
API route → ClickHouse or Mock DB
```

## Key Components

### `EntityGrid`
Core grid component that wraps AG Grid React with SSRM configuration.

**Location**: `shared/grid/entity-grid.tsx`

**Responsibilities**:
- AG Grid module registration (`ensureAgGridReadyFor`)
- SSRM datasource configuration (`serverSideDatasource.getRows`)
- Column definition resolution (async `config.colDefs()`)
- Error handling and loading states

**SSRM Callback Pattern**:
```typescript
params.api.setGridOption('serverSideDatasource', {
  async getRows(p: IServerSideGetRowsParams) {
    try {
      const r = await config.fetcher(p.request, distinctId);
      p.success({ rowData: r.rows, rowCount: r.totalSearchCount });
    } catch (e) {
      p.fail(); // AG Grid expected pattern
      onLoadError?.(e);
    }
  },
});
```

### `EntityGridHost`
Host component that wraps `EntityGrid` with toolbar and error UI.

**Location**: `shared/grid/entity-grid-host.tsx`

**Features**:
- `GridMenubar` integration (search, export, saved views)
- Error alerts with retry functionality
- State management (column state, filters, sorts)

### Entity Configs
Per-entity configuration files that define column definitions, default sort, and UI settings.

**Location**: `{projects,addresses,companies}/config.ts`

**Structure**:
```typescript
export const projectsConfig: EntityGridConfig = {
  id: 'projects',
  colDefs: resolveColDefs, // async function returning ColDef[]
  defaultColDef: createDefaultColDef(),
  defaultSortModel: [{ colId: 'effective_date', sort: 'desc' }],
  fetcher: createEntityFetcher('projects'),
  ui: { rowHeight: 42, headerHeight: 38 },
};
```

### Registry Pattern
Centralized registry maps entity IDs to configurations.

**Location**: `index.ts`

```typescript
export const registry = {
  projects: projectsConfig,
  addresses: addressesConfig,
  companies: companiesConfig,
} as const;

export const getEntityConfig = (id: keyof typeof registry) => registry[id];
```

**Usage in Routes**:
```typescript
const config = getEntityConfig(entity as 'projects' | 'addresses' | 'companies');
return <EntityGridHost config={config} />;
```

## Data Fetching

### Fetcher Pattern
`createEntityFetcher()` transforms AG Grid SSRM requests to API query params.

**Location**: `shared/grid/fetchers.ts`

**Request Transformation**:
- AG Grid `startRow`/`endRow` → `page`/`pageSize` query params
- AG Grid `sortModel` → `sortBy`/`sortDir` query params
- AG Grid `filterModel` → `filters` JSON query param

**API Contract**:
```
GET /api/v1/entity/{entity}?page=0&pageSize=50&sortBy=effective_date&sortDir=desc
```

**Response Format**:
```typescript
{
  data: Record<string, unknown>[],
  total: number,
  page: number,
  pageSize: number
}
```

**Error Handling**:
- HTTP 401 → "Unauthorized: Please sign in again."
- HTTP 403 → "Forbidden: You do not have permission..." (role required: org:member)
- Other errors → Error message from API response

### Credentials & Authentication
Fetchers use `credentials: 'include'` to send cookies with same-origin requests:
```typescript
const res = await fetch(`/api/v1/entity/${entity}?${sp.toString()}`, { 
  credentials: 'include' 
});
```

## Mock vs ClickHouse Paths

### Mock Mode
Enabled via `CORSO_USE_MOCK_DB=true` environment variable.

**Behavior**:
- Fetches data from `/__mockdb__/{entity}.json` static files
- Applies filtering, sorting, pagination in-memory
- Used for development and testing

**Mock Data Location**: `public/__mockdb__/`

### ClickHouse Mode (Production)
When `CORSO_USE_MOCK_DB` is not set or `false`:

**Behavior**:
- API route queries ClickHouse database
- Server-side filtering, sorting, pagination
- Requires authentication (Clerk) and RBAC (org:member role)

**API Route**: `app/api/v1/entity/[entity]/route.ts`

## Column Definitions

Column definitions are framework-agnostic using `TableColumnConfig` schema.

**Location**: `lib/services/entity/{entity}/columns.config.ts`

**Schema**:
```typescript
{
  id: string;           // Column identifier
  label: string;        // Display label
  accessor: string;     // Data field path
  sortable: boolean;    // Enable sorting
  hidden: boolean;      // Initially hidden
  width?: number;       // Fixed width
  format?: 'currency' | 'date' | 'datetime' | 'link';
}
```

**Adapter Pattern**:
`lib/services/entity/adapters/aggrid.ts` converts `TableColumnConfig` → AG Grid `ColDef`:
- Maps `accessor` → `field`
- Maps `label` → `headerName`
- Applies formatters based on `format` type

## Adding a New Entity

### Step 1: Create Column Configuration
Create `lib/services/entity/{entity}/columns.config.ts`:

```typescript
import { type TableColumnConfig } from '../types';

export const {ENTITY}_COLUMNS: TableColumnConfig[] = [
  { id: 'id', label: 'ID', accessor: 'id', sortable: true, hidden: false },
  // ... more columns
];
```

### Step 2: Create Entity Config
Create `components/dashboard/entity/{entity}/config.ts`:

```typescript
'use client';
import { toColDef } from '@/lib/services/entity/adapters/aggrid';
import { {ENTITY}_COLUMNS } from '@/lib/services/entity/{entity}/columns.config';
import type { ColDef } from 'ag-grid-community';
import { createDefaultColDef } from '../shared/ag-grid-config';
import { createEntityFetcher } from '../shared/grid/fetchers';
import type { EntityGridConfig } from '@/types/dashboard';

async function resolveColDefs(): Promise<ColDef[]> {
  const defs = await Promise.all({ENTITY}_COLUMNS.map(toColDef));
  return defs;
}

export const {entity}Config: EntityGridConfig = {
  id: '{entity}',
  colDefs: resolveColDefs,
  defaultColDef: createDefaultColDef(),
  defaultSortModel: [{ colId: 'id', sort: 'desc' }],
  fetcher: createEntityFetcher('{entity}'),
  ui: { rowHeight: 38, headerHeight: 40 },
};
```

### Step 3: Add to Registry
Update `components/dashboard/entity/index.ts`:

```typescript
import { {entity}Config } from './{entity}/config';

export const registry = {
  projects: projectsConfig,
  addresses: addressesConfig,
  companies: companiesConfig,
  {entity}: {entity}Config, // Add here
} as const;
```

### Step 4: Add API Route Support
Update `lib/validators/entity.ts` to include new entity in `EntityParamSchema`.

### Step 5: Add Mock Data (Optional)
Create `public/__mockdb__/{entity}.json` with sample data array.

## Known Limitations

### Filtering
- **Limited filter types**: Only `eq`, `contains`, `gt`, `lt`, `gte`, `lte`, `in`, `between`, `bool` operations supported
- **No client-side filtering**: All filters applied server-side
- **No filter persistence**: Filters reset on page refresh (saved views can preserve state)

### Sorting
- **Single-column sorting**: Only first sort in `sortModel` array is applied
- **No multi-column sorting**: AG Grid allows multi-column but API only uses first

### Performance
- **Server-side pagination required**: Large datasets require proper pagination
- **No virtualization**: AG Grid handles this internally, but performance degrades with very large result sets

### Type Safety
- **`as any` usage**: Some AG Grid prop types require `as any` casts due to strict TypeScript types
- **Runtime validation**: API responses validated at runtime, not compile-time

## Environment Variables

- **`NEXT_PUBLIC_AGGRID_ENTERPRISE=1`** - Required for SSRM (server-side row model)
- **`NEXT_PUBLIC_AGGRID_LICENSE_KEY`** - Optional, removes watermark in production
- **`CORSO_USE_MOCK_DB=true`** - Enable mock database mode

## Related Documentation

- [`lib/services/entity/README.md`](../../../lib/services/entity/README.md) - Service layer documentation
- [`.cursor/rules/entity-grid-architecture.mdc`](../../../../.cursor/rules/entity-grid-architecture.mdc) - Architecture rules and patterns
