---
title: "Dashboard"
description: "UI components for the components system, following atomic design principles. Located in dashboard/."
category: "components"
last_updated: "2025-12-14"
status: "active"
---
# Dashboard Components

Dashboard UI components for the Corso platform, including entity management grids, layout components, sidebar navigation, and dashboard-specific functionality.

## Overview

The `components/dashboard` domain provides all UI components for the authenticated dashboard experience. This includes entity grids (projects, companies, addresses), dashboard layouts, sidebar navigation, and specialized dashboard widgets.

### Key Responsibilities

- **Entity Management**: Grid components for managing projects, companies, and addresses
- **Layout Components**: Dashboard layout, sidebar, and header components
- **Navigation**: Sidebar navigation with context and tooltips
- **Dashboard Features**: AI mode, entity configuration, and dashboard-specific widgets

## Directory Structure

```
components/dashboard/
├── index.ts                    # Main barrel exports
├── corso-ai-mode.tsx          # AI mode component
├── entity/                     # Entity management components
│   ├── index.ts               # Entity barrel exports
│   ├── addresses/             # Address entity components
│   │   ├── config.ts         # Address grid configuration
│   │   └── README.md
│   ├── companies/             # Company entity components
│   │   ├── config.ts         # Company grid configuration
│   │   └── README.md
│   ├── projects/              # Project entity components
│   │   ├── config.ts         # Project grid configuration
│   │   └── README.md
│   └── shared/                # Shared entity utilities
│       ├── ag-grid-config.ts # AG Grid configuration
│       ├── grid/              # Grid components
│       │   ├── entity-grid.tsx
│       │   ├── entity-grid-host.tsx
│       │   ├── ag-grid-modules.ts
│       │   └── fetchers.ts
│       └── renderers/         # Cell renderers
│           └── value-formatter.ts
├── header/                     # Dashboard header components
│   └── dashboard-header.tsx
├── layout/                     # Layout components
│   ├── dashboard-layout.tsx
│   ├── dashboard-sidebar.tsx
│   ├── dashboard-top-bar.tsx
│   └── README.md
└── sidebar/                    # Sidebar components
    ├── sidebar-context.tsx
    ├── sidebar-item.tsx
    ├── sidebar-root.tsx
    ├── sidebar-tooltip-layer.tsx
    ├── sidebar-tooltip.tsx
    ├── sidebar-top.tsx
    ├── sidebar-user-profile.tsx
    ├── sidebar.module.css
    └── README.md
```

## Public API

### Main Exports (`@/components/dashboard`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `DashboardLayout` | Main dashboard layout wrapper | Component | `<DashboardLayout>{children}</DashboardLayout>` |
| `EntityGrid` | Generic entity grid component | Component | `<EntityGrid entity="projects" />` |
| `EntityGridHost` | Client-side grid host | Component | `<EntityGridHost config={config} />` |
| `SidebarRoot` | Dashboard sidebar root | Component | `<SidebarRoot>{items}</SidebarRoot>` |
| `DashboardHeader` | Dashboard header component | Component | `<DashboardHeader />` |

### Entity Components (`@/components/dashboard/entity`)

| Export | Purpose | Type | Usage |
|--------|---------|------|-------|
| `getEntityConfig()` | Get entity configuration | Function | `const config = getEntityConfig('projects')` |
| `EntityGrid` | Generic entity grid | Component | `<EntityGrid entity="companies" />` |

## Runtime Requirements

### Environment Support

- **Runtime**: Client (React components)
- **Client Context**: Yes (all components are client components)
- **Server Context**: No (dashboard components are client-only)

### Component Usage

```typescript
'use client';

import { DashboardLayout } from '@/components/dashboard';
import { EntityGrid } from '@/components/dashboard/entity';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <EntityGrid entity="projects" />
    </DashboardLayout>
  );
}
```

## Usage Examples

### Basic Dashboard Layout

```typescript
'use client';

import { DashboardLayout } from '@/components/dashboard';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div>Dashboard Content</div>
    </DashboardLayout>
  );
}
```

### Entity Grid Integration

```typescript
'use client';

import { EntityGridHost } from '@/components/dashboard/entity';
import { getEntityConfig } from '@/components/dashboard/entity';

export default function ProjectsPage() {
  const config = getEntityConfig('projects');
  
  return <EntityGridHost config={config} />;
}
```

### Sidebar Navigation

```typescript
'use client';

import { SidebarRoot, SidebarItem } from '@/components/dashboard/sidebar';

export function DashboardSidebar() {
  return (
    <SidebarRoot>
      <SidebarItem href="/dashboard" label="Dashboard" />
      <SidebarItem href="/dashboard/projects" label="Projects" />
      <SidebarItem href="/dashboard/companies" label="Companies" />
    </SidebarRoot>
  );
}
```

## Entity Configuration

### Entity Types

The dashboard supports three entity types:

1. **Projects** (`projects`): Construction project entities
2. **Companies** (`companies`): Company/organization entities
3. **Addresses** (`addresses`): Address/location entities

### Entity Grid Configuration

Each entity has a configuration file (`config.ts`) that defines:

- Column definitions
- Grid options
- Data fetching configuration
- Filter and sort options

Example:

```typescript
// components/dashboard/entity/projects/config.ts
import { getEntityConfig } from '@/components/dashboard/entity';
import { PROJECTS_COLUMNS } from '@/lib/services/entity/projects/columns.config';

export const projectsConfig = {
  entity: 'projects' as const,
  columns: PROJECTS_COLUMNS,
  // ... other config
};
```

## Styling & Theming

### CSS Modules

Sidebar components use CSS modules for styling:

- `sidebar.module.css`: Sidebar-specific styles

### Design Tokens

All components use design tokens from `@/styles/tokens`:

- Colors: `--foreground`, `--background`, `--primary`
- Spacing: `--space-*` tokens
- Typography: `--font-*` variables

## Dependencies & Integrations

### Internal Dependencies

- **AG Grid**: Entity grids use AG Grid for data tables
- **React Query**: Data fetching via warehouse query hooks
- **Clerk**: User authentication and profile components

### External Integrations

- **AG Grid Community**: Table/grid functionality
- **React**: Component framework

## Related Documentation

- [Entity Grid Architecture](../../docs/ui/table.md) - Table UI updates and architecture
- [Dashboard Routes](../../app/(protected)/dashboard/README.md) - Dashboard route structure
- [Entity Services](../../lib/services/entity/README.md) - Entity data services

---

**Last updated:** 2025-12-13  
**Runtime:** Client (React components)
