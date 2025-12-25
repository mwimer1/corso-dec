---
status: active
last_updated: 2025-12-25
---

# Entity Service Layer

Service layer for entity data operations (projects, companies, addresses) supporting both ClickHouse and mock database modes.

## Architecture

The entity service layer provides a unified interface for entity data operations regardless of data source:

```
API Route
  ↓
fetchEntityData() or getEntityPage()
  ↓
├─→ Mock Mode: getEntityPage() → __mockdb__ JSON files
└─→ ClickHouse Mode: queryEntityData() → ClickHouse database
```

## Core Functions

### `fetchEntityData()`
High-level entity data fetcher with automatic mock/real database fallback.

**Location**: `actions.ts`

**Usage**:
```typescript
const result = await fetchEntityData('projects', userId, {
  page: 0,
  pageSize: 50,
  sort: { column: 'effective_date', direction: 'desc' },
  filters: [{ field: 'status', op: 'eq', value: 'active' }],
});
```

**Behavior**:
1. Checks `CORSO_USE_MOCK_DB` environment variable
2. If mock mode: calls `getEntityPage()` with public JSON files
3. If real mode: queries ClickHouse via `queryEntityData()`
4. Returns unified result format: `{ data: T[], total: number, page: number, pageSize: number }`

### `getEntityPage()`
Edge-safe entity data fetcher supporting both mock and real database paths.

**Location**: `lib/api/data.ts`

**Mock Mode**:
- Fetches from `/__mockdb__/{entity}.json`
- Applies filtering, sorting, pagination in-memory
- Returns same format as real database path

**Real Database Mode**:
- Calls `/api/v1/entity/{entity}` endpoint
- Delegates to ClickHouse query execution
- Returns paginated results

### `queryEntityData()`
Direct ClickHouse query executor (server-only).

**Location**: `lib/integrations/clickhouse/entity-query.server.ts`

**Usage**: Internal use by API routes, not called directly from client code.

## Mock Database Mode

### Configuration
Set `CORSO_USE_MOCK_DB=true` in environment variables.

### Mock Data Location
Mock data files live in `public/__mockdb__/`:
- `projects.json`
- `companies.json`
- `addresses.json`

### Mock Data Format
Each file contains an array of entity objects:

```json
[
  {
    "id": "123",
    "building_permit_id": "PERMIT-001",
    "status": "active",
    "job_value": 50000,
    "effective_date": "2024-01-15",
    ...
  },
  ...
]
```

### Query Processing
Mock mode uses `processQuery()` utility to apply:
- Pagination (`page`, `pageSize`)
- Sorting (`sort.column`, `sort.direction`)
- Filtering (`filters` array)
- Search (text search across fields)

**Limitations**:
- In-memory processing (not suitable for very large datasets)
- Filter operations limited to supported types (`eq`, `contains`, etc.)
- Search is case-insensitive substring matching

## ClickHouse Mode (Production)

### Configuration
When `CORSO_USE_MOCK_DB` is not set or `false`, queries execute against ClickHouse.

### Query Building
ClickHouse queries are built with:
- **WHERE clauses** from filters (parameterized for safety)
- **ORDER BY** from sort configuration
- **LIMIT/OFFSET** from pagination

### Tenant Isolation
All queries are scoped to the active organization:
- `org_id` filter automatically applied
- User must have `org:member` role or higher
- Enforced via API route authentication

### Performance
- Indexed queries for common fields (status, effective_date, etc.)
- Efficient pagination with LIMIT/OFFSET
- Server-side filtering reduces data transfer

## API Response Contract

### Success Response
```typescript
{
  data: Record<string, unknown>[],  // Array of entity objects
  total: number,                     // Total count (for pagination)
  page: number,                      // Current page index
  pageSize: number                   // Page size
}
```

### Error Response
```typescript
{
  success: false,
  error: string,                     // Error message
  code: string,                      // Error code (e.g., "FORBIDDEN", "INVALID_ENTITY")
  details?: unknown                  // Optional error details
}
```

## Column Configuration

Column definitions are framework-agnostic using `TableColumnConfig` schema.

**Location**: `{entity}/columns.config.ts`

**Schema**:
```typescript
{
  id: string;           // Unique column identifier
  label: string;        // Display label
  accessor: string;     // Data field path (dot notation supported)
  sortable: boolean;    // Enable sorting
  hidden: boolean;      // Initially hidden
  width?: number;       // Fixed width in pixels
  format?: 'currency' | 'date' | 'datetime' | 'link' | 'number';
}
```

**Example**:
```typescript
export const PROJECTS_COLUMNS: TableColumnConfig[] = [
  { 
    id: 'building_permit_id', 
    label: 'Project ID', 
    accessor: 'building_permit_id', 
    sortable: true, 
    hidden: false, 
    width: 160 
  },
  { 
    id: 'job_value', 
    label: 'Value', 
    accessor: 'job_value', 
    sortable: true, 
    format: 'currency' 
  },
];
```

## Grid Configuration

Entity-specific grid metadata (table name, primary key, etc.) is stored in config files.

**Location**: `config.ts`

**Structure**:
```typescript
{
  tableName: string;      // ClickHouse table name
  primaryKey: string;     // Primary key field for sorting defaults
  // ... other metadata
}
```

## Filter Operations

Supported filter operations:

- **`eq`** - Equality (`field = value`)
- **`contains`** - Substring match (`field LIKE '%value%'`)
- **`gt`** - Greater than (`field > value`)
- **`lt`** - Less than (`field < value`)
- **`gte`** - Greater than or equal (`field >= value`)
- **`lte`** - Less than or equal (`field <= value`)
- **`in`** - Array membership (`field IN (values)`)
- **`between`** - Range (`field BETWEEN value[0] AND value[1]`)
- **`bool`** - Boolean equality (`field = true/false`)

## Type Definitions

### EntityFetchParams
```typescript
{
  page: number;
  pageSize: number;
  sort: { column: string; direction: 'asc' | 'desc' };
  search?: string;
  filters?: Array<{
    field: string;
    op: 'eq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between' | 'bool';
    value: unknown;
  }>;
}
```

### EntityFetchResult
```typescript
{
  data: T[];              // Array of entity objects
  total: number;          // Total count
  page: number;           // Current page
  pageSize: number;       // Page size
}
```

## Adding a New Entity

### Step 1: Create Column Configuration
Create `{entity}/columns.config.ts` with `TableColumnConfig[]` array.

### Step 2: Add Grid Config
Update `config.ts` to include new entity metadata:
- Table name
- Primary key field
- Default sort column

### Step 3: Add Mock Data (Optional)
Create `public/__mockdb__/{entity}.json` with sample data.

### Step 4: Update Validators
Add entity to `EntityParamSchema` in `lib/validators/entity.ts`.

### Step 5: Update Types
Add entity to `EntityKind` type union if needed.

## Related Documentation

- [`components/dashboard/entity/README.md`](../../../components/dashboard/entity/README.md) - UI component layer
- [`.cursor/rules/entity-grid-architecture.mdc`](../../../../.cursor/rules/entity-grid-architecture.mdc) - Architecture rules
