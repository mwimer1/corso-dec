---
category: "documentation"
last_updated: "2025-12-13"
status: "draft"
title: "Dashboard"
description: "Documentation and resources for documentation functionality. Located in (protected)/dashboard/."
---
## Overview

The dashboard provides authenticated users with entity management (projects, companies, addresses), account management, and billing. Dynamic entity routes provide data management functionality.

```
app/(protected)/dashboard/
├── layout.tsx                 # Main layout with auth and providers
├── error.tsx                  # Error boundary
├── account/
│   └── page.tsx               # Clerk UserProfile integration
├── subscription/
│   └── page.tsx               # Personal subscription management
└── (entities)/
    └── [entity]/
        ├── page.tsx           # Dynamic entity pages (addresses/companies/projects)
        └── loading.tsx        # Entity loading states
```

## Key Routes

| Path | Purpose | Implementation |
|------|---------|----------------|
| `/dashboard/addresses` | Address/property management | `(entities)/[entity]/page.tsx` |
| `/dashboard/companies` | Company/contractor management | `(entities)/[entity]/page.tsx` |
| `/dashboard/projects` | Project/permit management | `(entities)/[entity]/page.tsx` |
| `/dashboard/account` | User profile management via Clerk | `account/page.tsx` |
| `/dashboard/subscription` | Personal billing & subscription management | `subscription/page.tsx` |

## Route Groups

### `(entities)/` Route Group
- **Purpose:** Organizes entity management using dynamic routing
- **Dynamic Route:** `[entity]` parameter supports `addresses`, `companies`, `projects`
- **Static Generation:** Uses `generateStaticParams()` for optimization
- **Shared Implementation:** Single `page.tsx` handles all entity types

## Key Features

### Entity Management
- **Dynamic Routing:** Single route handles all entity types
- **Configuration-Driven:** Entity-specific settings via `ENTITY_CONFIG`
- **Static Generation:** Pre-built pages for all entities

## Implementation

### Layout & Providers
```tsx
// layout.tsx - Root layout with authentication
export default async function DashboardLayout({ children }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <DashboardProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </DashboardProvider>
  );
}
```

### Entity Pages (Flattened Grid Architecture)
```tsx
// (entities)/[entity]/page.tsx - Dynamic entity handling via registry
import { EntityParamSchema } from '@/lib/validators/entity';
import { EntityGridHost, getEntityConfig } from '@/components/dashboard/entity';

export async function generateStaticParams() {
  return [
    { entity: "addresses" },
    { entity: "companies" },
    { entity: "projects" },
  ];
}

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

## Navigation & Sidebar

- **Dynamic Navigation:** Filtered by RBAC and feature flags via `@/lib/dashboard/nav.tsx`
- **Active State:** Applied for exact path matches
- **Accessibility:** Proper ARIA labels and `aria-current="page"`

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
- Entities: `http://localhost:3000/dashboard/projects`
- Account: `http://localhost:3000/dashboard/account`
- Subscription: `http://localhost:3000/dashboard/subscription`

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DashboardLayout` | `@/components/dashboard` | Main layout shell |
| `DashboardProvider` | `@/contexts/dashboard` | Shared state management |
| `EntityGridHost` | `@/components/dashboard/entity` | Client grid host via typed registry |
| `BarChart` | `@/components/dashboard` | Analytics charts |

---

**Last updated: 2025-10-07**

