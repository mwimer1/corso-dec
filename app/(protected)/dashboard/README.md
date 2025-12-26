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
├── layout.tsx                 # Root layout: auth + DashboardLayout wrapper
├── page.tsx                   # Index route: redirects to /dashboard/chat
├── error.tsx                  # Error boundary
├── chat/
│   └── page.tsx               # CorsoAI chat (default dashboard landing)
├── (entities)/
│   └── [entity]/
│       └── page.tsx           # Dynamic entity pages (addresses/companies/projects)
├── account/
│   ├── layout.tsx             # Account metadata layout
│   └── page.tsx               # Clerk UserProfile integration
└── subscription/
    ├── layout.tsx             # Subscription metadata layout
    └── page.tsx               # Personal billing & subscription management
```

## Key Routes

| Path | Purpose | Implementation |
|------|---------|----------------|
| `/dashboard` | Redirects to `/dashboard/chat` (default dashboard landing) | `page.tsx` (redirect) |
| `/dashboard/chat` | CorsoAI chat assistant (default dashboard landing) | `chat/page.tsx` |
| `/dashboard/addresses` | Address/property management | `(entities)/[entity]/page.tsx` |
| `/dashboard/companies` | Company/contractor management | `(entities)/[entity]/page.tsx` |
| `/dashboard/projects` | Project/permit management | `(entities)/[entity]/page.tsx` |
| `/dashboard/account` | User profile management via Clerk | `account/page.tsx` |
| `/dashboard/subscription` | Personal billing & subscription management | `subscription/page.tsx` |

## Route Groups

### `(entities)/` Route Group
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
Handles authentication and wraps all dashboard pages with `DashboardLayout`. All dashboard routes share the same layout wrapper.

```tsx
// layout.tsx - Root layout with authentication and DashboardLayout wrapper
export default async function Layout({ children }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return <DashboardLayout>{children}</DashboardLayout>;
}
```

**Note:** The top bar has been removed globally from all dashboard routes to maximize vertical space. All routes (chat, entities, account, subscription) share the same layout without a top bar.

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
  const title = entity.charAt(0).toUpperCase() + entity.slice(1);
  return { title: `${title} | Dashboard | Corso`, description: `View and manage all ${entity} in your dashboard.` };
}

export default async function EntityPage({ params }: { params: Promise<{ entity: string }> }) {
  const parsed = EntityParamSchema.safeParse(await params);
  if (!parsed.success) return notFound();
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
