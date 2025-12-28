---
title: "lib/services/entities"
last_updated: "2025-01-29"
category: "services"
---

# Entity Services

Entity management service layer for dashboard data tables (projects, addresses, companies).

## Purpose

Provides framework-agnostic column definitions, data fetching, and entity configuration for the dashboard entity grid system.

## Structure

```
lib/services/entities/
  projects/
    columns.config.ts    # Projects column definitions (TableColumnConfig)
  companies/
    columns.config.ts    # Companies column definitions (TableColumnConfig)
  addresses/
    columns.config.ts   # Addresses column definitions (TableColumnConfig)
  adapters/
    aggrid.ts           # toColDef() adapter for AG Grid mapping
  actions.ts             # Entity data fetching actions
  contracts.ts           # Type definitions and contracts
  pages.ts               # Shared getEntityPage service
  config.ts              # Grid configuration loader
  search-fields.ts       # Searchable field configurations
  types.ts               # TableColumnConfig type definitions
```

## Key Entry Points

- **Column Definitions**: `lib/services/entities/<entity>/columns.config.ts` - Framework-agnostic column configs
- **Data Fetching**: `lib/services/entities/actions.ts` - Server-side data fetching
- **AG Grid Adapter**: `lib/services/entities/adapters/aggrid.ts` - Converts TableColumnConfig to AG Grid ColDef

## Usage

```typescript
// Import column definitions
import { PROJECTS_COLUMNS } from '@/lib/services/entities/projects/columns.config';

// Use in entity grid config
import { getEntityConfig } from '@/components/dashboard/entities';
const config = getEntityConfig('projects');
```

## Related

- **UI Components**: `components/dashboard/entities/` - Entity grid components
- **API Routes**: `app/api/v1/entity/` - Entity API endpoints
- **Validators**: `lib/validators/entity.ts` - Entity parameter validation

---

_Last updated: 2025-01-29_
