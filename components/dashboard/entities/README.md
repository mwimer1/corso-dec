---
title: "Entities"
last_updated: "2026-01-07"
category: "components"
status: "active"
description: "Entity grid components for dashboard data management (projects, companies, addresses). Located in dashboard/entities/."
---
# Entities

The entities directory contains standardized entity grid components for the Corso dashboard, providing a unified data grid interface for managing projects, companies, and addresses.

## Overview

This directory implements a shared entity grid architecture using AG Grid Enterprise with server-side row model. Each entity (projects, companies, addresses) has its own configuration that defines column definitions, default sorting, and data fetching behavior.

## Directory Structure

```
components/dashboard/entities/
├── addresses/
│   └── config.ts          # Addresses entity grid configuration
├── companies/
│   └── config.ts          # Companies entity grid configuration
├── projects/
│   └── config.ts          # Projects entity grid configuration
├── shared/
│   ├── ag-grid-config.ts  # AG Grid default column configuration
│   ├── entity-grid.tsx    # Core EntityGrid component
│   ├── entity-grid-host.tsx # Client wrapper for EntityGrid
│   ├── fetchers.ts        # Data fetching utilities
│   ├── grid-menubar.tsx   # Grid menu bar component
│   └── use-grid-density.ts # Grid density hook
├── index.ts               # Entity registry and exports
└── README.md              # This file
```

## Entities

### Projects

**Configuration**: `projects/config.ts`

- **Default Sort**: `effective_date` (descending)
- **Columns**: Defined in `@/lib/entities/projects/columns.config`
- **Fetcher**: `createEntityFetcher('projects')`
- **UI Settings**: Row height 40px, header height 40px

### Companies

**Configuration**: `companies/config.ts`

- **Default Sort**: `job_value_ttm` (descending)
- **Columns**: Defined in `@/lib/entities/companies/columns.config`
- **Fetcher**: `createEntityFetcher('companies')`
- **UI Settings**: Row height 40px, header height 40px

### Addresses

**Configuration**: `addresses/config.ts`

- **Default Sort**: `total_job_value` (descending)
- **Columns**: Defined in `@/lib/entities/addresses/columns.config`
- **Fetcher**: `createEntityFetcher('addresses')`
- **UI Settings**: Row height 40px, header height 40px, group header height 26px

## Usage

### Importing Components

```typescript
// Import the grid components
import { EntityGrid, EntityGridHost } from '@/components/dashboard/entities';

// Import entity configuration
import { getEntityConfig } from '@/components/dashboard/entities';

// Get specific entity config
const projectsConfig = getEntityConfig('projects');
const companiesConfig = getEntityConfig('companies');
const addressesConfig = getEntityConfig('addresses');
```

### Using Entity Grid

The entity grid is typically used through the dynamic route at `app/(protected)/dashboard/(entities)/[entity]/page.tsx`, which validates the entity parameter and renders the appropriate grid using the registry.

## Architecture

### Entity Registry

The `index.ts` file exports a registry that maps entity IDs to their configurations:

```typescript
export const registry = {
  projects: projectsConfig,
  addresses: addressesConfig,
  companies: companiesConfig,
} as const;
```

### Configuration Pattern

Each entity config follows a consistent pattern:

1. **Column Definitions**: Uses framework-agnostic `TableColumnConfig` from `@/lib/entities/<entity>/columns.config`
2. **Adapter**: Maps to AG Grid `ColDef` via `toColDef()` adapter
3. **Fetcher**: Uses `createEntityFetcher()` for server-side data fetching
4. **UI Settings**: Defines row heights and header heights

### Shared Components

- **EntityGrid**: Core grid component with AG Grid Enterprise features
- **EntityGridHost**: Client-side wrapper that handles AG Grid module registration
- **Fetchers**: Standardized data fetching with server-side pagination support

## Related Documentation

- [Entity Grid Architecture](../../../.cursor/rules/entity-grid-architecture.mdc) - Detailed architecture documentation
- [Column Definitions](../../../lib/entities/README.md) - Framework-agnostic column configuration
- **Dashboard Route**: `app/(protected)/dashboard/README.md` - Route implementation details

