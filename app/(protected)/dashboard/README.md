---
title: "Dashboard"
description: "Documentation and resources for documentation functionality. Located in (protected)/dashboard/."
last_updated: "2025-12-15"
category: "documentation"
status: "draft"
---
## Overview

The dashboard provides authenticated users with entity management (projects, companies, addresses), account management, billing, and AI chat. The layout uses Next.js App Router route groups for organizational purposes, but all routes share the same layout without a global top bar to maximize vertical space.

```
app/(protected)/dashboard/
├── layout.tsx                 # Root layout: auth only (no shell)
├── page.tsx                   # Index route: redirects to /dashboard/chat
├── error.tsx                  # Error boundary
├── (no-topbar)/               # Route group: chat and full-height pages
│   ├── layout.tsx             # Dashboard shell + sidebar (no top bar)
│   └── chat/
│       └── page.tsx           # CorsoAI chat (default dashboard landing)
└── (with-topbar)/             # Route group: entity and settings pages
    ├── layout.tsx             # Dashboard shell + sidebar (no top bar)
    ├── (entities)/
    │   └── [entity]/
    │       └── page.tsx       # Dynamic entity pages (addresses/companies/projects)
    ├── account/
    │   └── page.tsx           # Clerk UserProfile integration
    └── subscription/
        └── page.tsx           # Personal billing & subscription management
```

## Key Routes

| Path | Purpose | Implementation | Layout Group |
|------|---------|----------------|--------------|
| `/dashboard` | Redirects to `/dashboard/chat` (default dashboard landing) | `page.tsx` (redirect) | N/A (redirect only) |
| `/dashboard/chat` | CorsoAI chat assistant (default dashboard landing) | `(no-topbar)/chat/page.tsx` | `(no-topbar)` |
| `/dashboard/addresses` | Address/property management | `(with-topbar)/(entities)/[entity]/page.tsx` | `(with-topbar)` |
| `/dashboard/companies` | Company/contractor management | `(with-topbar)/(entities)/[entity]/page.tsx` | `(with-topbar)` |
| `/dashboard/projects` | Project/permit management | `(with-topbar)/(entities)/[entity]/page.tsx` | `(with-topbar)` |
| `/dashboard/account` | User profile management via Clerk | `(with-topbar)/account/page.tsx` | `(with-topbar)` |
| `/dashboard/subscription` | Personal billing & subscription management | `(with-topbar)/subscription/page.tsx` | `(with-topbar)` |

## Route Groups

### `(no-topbar)/` Route Group
- **Purpose:** Organizes chat and other full-height pages
- **Layout:** Renders `DashboardLayout` (no top bar - removed globally)
- **Routes:** Chat (default dashboard landing)
- **Use Case:** Full-height content like chat interfaces

### `(with-topbar)/` Route Group
- **Purpose:** Organizes entity pages and settings pages
- **Layout:** Renders `DashboardLayout` (no top bar - removed globally)
- **Routes:** Entity pages (projects, companies, addresses), account, subscription
- **Use Case:** Pages with toolbars, tables, or settings that render their own headings if needed
- **Note:** The route group name is kept for organizational purposes but no longer controls top bar rendering

### `(entities)/` Route Group (nested under `(with-topbar)`)
- **Purpose:** Organizes entity management using dynamic routing
- **Dynamic Route:** `[entity]` parameter supports `addresses`, `companies`, `projects`
- **Dynamic Rendering:** Pages are rendered dynamically (`dynamic = 'force-dynamic'`) with no static generation
- **Shared Implementation:** Single `page.tsx` handles all entity types

## Key Features

### Entity Management
- **Dynamic Routing:** Single route handles all entity types
- **Configuration-Driven:** Entity-specific settings via `ENTITY_CONFIG` (front-end config registry via `getEntityConfig()`)
- **Dynamic Rendering:** Pages are rendered on-demand (no static generation)

## Layouts

### Root Layout (`layout.tsx`)
Handles authentication only. Route groups provide their own layout wrappers.

```tsx
// layout.tsx - Root layout with authentication only
export default async function Layout({ children }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return <>{children}</>;
}
```

### No Top Bar Layout (`(no-topbar)/layout.tsx`)
Renders the dashboard shell (sidebar + main content). Used for chat and other full-height pages.

```tsx
// (no-topbar)/layout.tsx
export default function NoTopBarLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

### With Top Bar Layout (`(with-topbar)/layout.tsx`)
Renders the dashboard shell (sidebar + main content). Used for entity pages and settings.

```tsx
// (with-topbar)/layout.tsx
export default function WithTopBarLayout({ children }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

**Note:** The top bar has been removed globally from all dashboard routes to maximize vertical space. Both route groups now render the same layout.

## Implementation

### Entity Pages (Flattened Grid Architecture)
```tsx
// (entities)/[entity]/page.tsx - Dynamic entity handling via registry
import { EntityParamSchema } from '@/lib/validators/entity';
import { EntityGridHost, getEntityConfig } from '@/components/dashboard/entity';

// Route config: dynamic rendering (no static generation)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ entity: string }> }) {
  const parsed = EntityParamSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const entity = parsed.data.entity;
  const config = {
    addresses: { title: 'Addresses' },
    companies: { title: 'Companies' },
    projects: { title: 'Projects' },
  }[entity]!;
  return { title: `${config.title} | Dashboard | Corso`, description: `View and manage all ${entity}.` };
}

export default async function EntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const parsed = EntityParamSchema.safeParse(await params);
  if (!parsed.success) notFound();
  const config = getEntityConfig(parsed.data.entity as 'projects'|'addresses'|'companies');
  return <EntityGridHost config={config} />;
}
```

## Dashboard Layout

The dashboard layout no longer includes a global top bar to maximize vertical space across all routes.

**All Routes:** All dashboard routes (chat, entities, account, subscription) share the same layout without a top bar. Pages should render their own headings if needed.

**Entity Pages:** Entity pages (Projects, Companies, Addresses) render a toolbar (`GridMenubar`) with saved searches, export options, and grid controls, but no global top bar.

## Navigation & Sidebar

- **Dynamic Navigation:** Filtered by RBAC and feature flags via `@/lib/dashboard/nav.tsx`
- **Active State:** Applied for exact path matches
- **Accessibility:** Proper ARIA labels and `aria-current="page"`
- **RBAC Enforcement:** Navigation items are filtered by user role. Final access control is enforced server-side via API endpoints (UI gating provides UX but is not the sole protection)

## Conventions

- **Imports:** Client components from `@/components/dashboard`, server builders from `@/lib/server/dashboard`
- **Runtime:** All dashboard routes declare Node.js runtime
- **Boundaries:** Clear client/server component separation

### Mock data (development)

Set the following to use mock JSON during development:

```bash
# .env.local
CORSO_USE_MOCK_DB=true
```

With this flag, the entity service (`fetchEntityData`) returns mock JSON via `getEntityPage()`; no route or grid changes are required.

## Development

```bash
pnpm dev                    # Start dev server
pnpm typecheck             # TypeScript validation
pnpm lint                   # Lint code
pnpm vitest run            # Test components
```

**Test URLs:**
- Chat (default): `http://localhost:3000/dashboard/chat`
- Entities: `http://localhost:3000/dashboard/projects`
- Account: `http://localhost:3000/dashboard/account`
- Subscription: `http://localhost:3000/dashboard/subscription`

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DashboardLayout` | `@/components/dashboard` | Main layout shell with sidebar (no top bar) |
| `DashboardSidebar` | `@/components/dashboard/layout` | Collapsible sidebar navigation |
| `EntityGridHost` | `@/components/dashboard/entity` | Client grid host via typed registry |
| `EntityGrid` | `@/components/dashboard/entity/shared/grid` | AG Grid wrapper with server-side data source |
| `GridMenubar` | `@/components/dashboard/entity/shared/grid` | Toolbar with saved searches, export, and grid controls |

---

**Last updated: 2025-01-28**
