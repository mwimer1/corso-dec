# Dashboard Components

Dashboard components provide the UI for authenticated user experiences including entity management (projects, companies, addresses), chat interface, and account settings.

## Structure

- **`entity/`** - Entity grid components for tabular data display (projects, companies, addresses)
- **`chat/`** - Chat interface components (CorsoAI assistant)
- **`layout/`** - Dashboard layout components (sidebar, shell)

## Entity Grid Architecture

Entity grids use a standardized architecture built on AG Grid Enterprise with server-side row model (SSRM):

### Core Components

1. **`EntityGrid`** (`entity/shared/grid/entity-grid.tsx`) - Core grid component with SSRM integration
2. **`EntityGridHost`** (`entity/shared/grid/entity-grid-host.tsx`) - Host component with toolbar and error handling
3. **Entity Configs** (`entity/{projects,addresses,companies}/config.ts`) - Per-entity configuration

### Architecture Overview

```
Route → EntityGridHost → EntityGrid → AG Grid (SSRM)
         ↓                ↓
    GridMenubar    createEntityFetcher
```

### Data Flow

1. User interacts with grid (sort, filter, paginate)
2. AG Grid SSRM calls `getRows()` callback with request params
3. `createEntityFetcher()` transforms AG Grid request to API format
4. Fetcher calls `/api/v1/entity/{entity}` with query params
5. API returns paginated data + total count
6. AG Grid displays results via `params.success()`

For detailed entity grid documentation, see [`entity/README.md`](./entity/README.md).

## Key Features

- **Server-side pagination** - Efficient handling of large datasets
- **Server-side sorting** - Sort operations performed on backend
- **Filtering** - Client-side filter UI with server-side application (limited filter types supported)
- **Type safety** - Full TypeScript support with framework-agnostic column definitions
- **Error handling** - Graceful error states with retry functionality
- **RBAC integration** - Role-based access control enforced server-side

## Development

### Adding New Components

1. Create component in appropriate subdirectory
2. Export from barrel file (`index.ts`) if needed
3. Follow TypeScript strict mode and component design system patterns
4. Add tests for new components

### Dependencies

- **AG Grid Enterprise** - Required for server-side row model (`NEXT_PUBLIC_AGGRID_ENTERPRISE=1`)
- **React Query** - Not used directly in entity grids (native AG Grid SSRM)
- **Clerk** - Authentication and RBAC

## Related Documentation

- [`entity/README.md`](./entity/README.md) - Entity grid architecture details
- [`../lib/services/entity/README.md`](../../lib/services/entity/README.md) - Entity service layer
- [`.cursor/rules/entity-grid-architecture.mdc`](../../.cursor/rules/entity-grid-architecture.mdc) - Architecture rules
