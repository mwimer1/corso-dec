---
description: "Dashboard UI components for the Corso platform."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Dashboard Components

Dashboard-specific UI components for the Corso platform, including entity management grids, layout components, and sidebar navigation.

## Overview

The `components/dashboard/` directory contains:
- **Entity grids**: Data grid components for projects, companies, and addresses
- **Layout components**: Dashboard header, navigation, and layout wrappers
- **Sidebar**: Navigation sidebar with user profile and menu items

## Directory Structure

```
components/dashboard/
├── entities/           # Entity grid components (projects, companies, addresses)
│   ├── addresses/     # Address entity grid configuration
│   ├── companies/      # Company entity grid configuration
│   ├── projects/       # Project entity grid configuration
│   ├── shared/         # Shared grid components (EntityGrid, fetchers)
│   └── index.ts        # Entity grid registry and exports
├── layout/             # Dashboard layout components
│   ├── dashboard-header.tsx
│   ├── dashboard-layout.tsx
│   ├── dashboard-nav.tsx
│   ├── dashboard-sidebar.tsx
│   └── dashboard-top-bar.tsx
└── sidebar/            # Sidebar navigation components
    ├── sidebar-context.tsx
    ├── sidebar-item.tsx
    ├── sidebar-root.tsx
    ├── sidebar-tooltip-layer.tsx
    ├── sidebar-tooltip.tsx
    ├── sidebar-top.tsx
    └── sidebar-user-profile.tsx
```

## Components

### Entity Grids (`entities/`)

Server-side rendered entity grids using AG Grid with server-side row model.

**Supported entities:**
- **Projects**: Fully implemented with complete column configuration
- **Companies**: Server-configured, client-side pending
- **Addresses**: Server-configured, client-side pending

**Key components:**
- `EntityGrid` - Generic entity grid component
- `EntityGridHost` - Client-side grid host wrapper
- `createEntityFetcher` - Entity data fetcher factory

**Usage:**
```typescript
import { EntityGridHost } from '@/components/dashboard/entities';
import { getEntityConfig } from '@/components/dashboard/entities';

const config = getEntityConfig('projects');
<EntityGridHost config={config} />
```

See [components/dashboard/entities/README.md](entities/README.md) for detailed entity grid documentation.

### Layout Components (`layout/`)

Dashboard layout and navigation components.

**Components:**
- `DashboardLayout` - Main dashboard layout wrapper
- `DashboardHeader` - Dashboard header with navigation
- `DashboardNav` - Navigation menu component
- `DashboardTopBar` - Top bar with user actions
- `DashboardSidebar` - Sidebar navigation component (used by DashboardLayout; new sidebar components available in `sidebar/` for custom implementations)

**Usage:**
```typescript
import { DashboardLayout } from '@/components/dashboard/layout/dashboard-layout';

<DashboardLayout>
  {children}
</DashboardLayout>
```

### Sidebar (`sidebar/`)

Modern sidebar navigation component with tooltips and user profile.

**Components:**
- `SidebarRoot` - Root sidebar container
- `SidebarItem` - Navigation item component
- `SidebarUserProfile` - User profile section
- `SidebarTooltip` - Tooltip component for sidebar items

**Usage:**
```typescript
import { SidebarRoot, SidebarItem } from '@/components/dashboard/sidebar';

<SidebarRoot>
  <SidebarItem href="/dashboard" icon={HomeIcon}>
    Dashboard
  </SidebarItem>
</SidebarRoot>
```

## Usage

### Importing Components

Import components from the appropriate subdirectory:

```typescript
// Entity grids
import { EntityGridHost } from '@/components/dashboard/entities';
import { getEntityConfig } from '@/components/dashboard/entities';

// Layout components
import { DashboardLayout } from '@/components/dashboard/layout/dashboard-layout';

// Sidebar
import { SidebarRoot, SidebarItem } from '@/components/dashboard/sidebar';
```

### Entity Grid Integration

Entity grids are integrated via the dynamic `[entity]` route:

```typescript
// app/(protected)/dashboard/(entities)/[entity]/page.tsx
import { getEntityConfig } from '@/components/dashboard/entities';
import { EntityGridHost } from '@/components/dashboard/entities';

const config = getEntityConfig(entity);
<EntityGridHost config={config} />
```

## Related Documentation

- [Entity Grid Architecture](../../.cursor/rules/entity-grid-architecture.mdc) - Entity grid architecture and patterns
- [Dashboard Entities](entities/README.md) - Entity grid components documentation
- **Dashboard Route**: `app/(protected)/dashboard/README.md` - Dashboard route documentation
- [Component Design System](../../.cursor/rules/component-design-system.mdc) - Component patterns

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active

