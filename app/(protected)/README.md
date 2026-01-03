---
status: "draft"
last_updated: "2026-01-03"
category: "documentation"
title: "(protected)"
description: "Documentation and resources for documentation functionality. Located in (protected)/."
---
## Overview

The `(protected)` route group contains all authenticated application pages requiring Clerk session validation. Features comprehensive security guards, onboarding gates, and unified error handling for dashboards, account management, billing, and entity operations.

## Directory Structure

```
app/(protected)/
├── client.tsx                 # Client wrapper with AppErrorBoundary
├── layout.tsx                 # Auth guards + onboarding gate
├── loading.tsx                # Loading fallback
├── error.tsx                  # Global error boundary
├── route.config.ts            # Protected access, no-cache config
├── dashboard/
│   ├── layout.tsx             # Dashboard auth + providers
│   ├── error.tsx              # Dashboard error boundary
│   ├── account/
│   │   └── page.tsx           # Clerk UserProfile integration (dashboard)
│   ├── subscription/
│   │   └── page.tsx           # Personal subscription management (dashboard)
│   ├── chat/
│   │   ├── page.tsx           # AI chat interface (Node.js runtime)
│   │   ├── loading.tsx        # Chat loading state
│   │   └── error.tsx          # Chat error boundary
│   └── (entities)/
│       └── [entity]/
│           ├── page.tsx       # Dynamic entity pages (addresses/companies/projects)
│           └── loading.tsx    # Entity loading states
```

## Key Routes

| Path | Purpose | Runtime | Status |
|------|---------|---------|--------|
| `/dashboard/chat` | CorsoAI chat assistant (default dashboard route) | Node.js | ✅ Active |
| `/dashboard/addresses` | Address/property management | Node.js | ✅ Active |
| `/dashboard/companies` | Company/contractor management | Node.js | ✅ Active |
| `/dashboard/projects` | Project/permit management | Node.js | ✅ Active |
| `/dashboard/account` | User profile management via Clerk | Node.js | ✅ Active |
| `/dashboard/subscription` | Personal billing & subscription management | Node.js | ✅ Active |

## Security & Authentication

### Core Security Features

- **Clerk Integration:** Server-side session validation via `auth()`
- **Onboarding Gate:** Automatic redirect to `/onboarding` for incomplete setup
- **Error Boundaries:** Comprehensive client-side error recovery
- **Runtime Enforcement:** All routes use Node.js runtime for security

### Layout Protection

```typescript
// layout.tsx - Server-side auth (onboarding gating removed for MVP)
export default async function ProtectedLayout({ children }: PropsWithChildren) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Onboarding gating removed for MVP: authenticated users proceed to protected app

  return <ProtectedClientWrapper>{children}</ProtectedClientWrapper>;
}
```

### Route Configuration

```typescript
// route.config.ts - Security metadata
export const route = {
  access: 'protected',
  cache: 'no-store',
  revalidate: 0,
  seo: {
    index: false,
  },
  owners: ['dashboard', 'account', 'subscription'],
} as const;
```

### Client Wrapper

```typescript
// client.tsx - Error boundary wrapper
export default function ProtectedClientWrapper({ children }) {
  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}
```

## Feature Areas

### AI Chat (`/dashboard/chat`)

**CorsoAI chat assistant - serves as the default dashboard landing page.**

```typescript
// chat/page.tsx - AI chat interface
export const runtime = 'nodejs';
export const metadata = { title: 'Chat | Dashboard | Corso', description: 'Corso AI chat workspace' };

export default function Page(): JSX.Element {
  return <ChatPageImpl />;
}
```

### Entity Management (`/dashboard/(entities)/*`)

**Dynamic route handling addresses, companies, and projects.**

```typescript
// (entities)/[entity]/page.tsx - Dynamic entity pages
export const runtime = 'nodejs';

export async function generateStaticParams() {
  return [{ entity: 'addresses' }, { entity: 'companies' }, { entity: 'projects' }];
}

export default async function EntityPage({ params }) {
  const { entity } = await params;
}
```

### Account Management (`/dashboard/account`)

**Clerk UserProfile integration for user account management within dashboard.**

### Subscription Management (`/dashboard/subscription`)

**Personal billing with Stripe portal integration within dashboard.**

```typescript
// subscription/page.tsx - Subscription management
export default function DashboardSubscriptionPage() {
  return (
    <AuthCard>
      <SubscriptionClient />
    </AuthCard>
  );
}
```

## Component Architecture

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `DashboardLayout` | `@/components/dashboard` | Main dashboard shell |
| `AuthCard` | `@/components/ui` | Consistent card styling |
| `RouteLoading` | `@/components/ui` | Loading states |
| `AppErrorBoundary` | `@/organisms` | Error recovery |

### Route Groups

- **`(entities)/`** - Dynamic routing for entity management
  - Supports: `addresses`, `companies`, `projects`
  - Static generation via `generateStaticParams()`

## Development

### Quick Start

```bash
pnpm dev                    # Start dev server
pnpm typecheck             # TypeScript validation
pnpm lint                   # Lint code
pnpm vitest run            # Test components
```

### Test URLs

| Route | Purpose | URL |
|-------|---------|-----|
| AI Chat | CorsoAI assistant (default dashboard route) | `http://localhost:3000/dashboard/chat` |
| Addresses | Address/property management | `http://localhost:3000/dashboard/addresses` |
| Companies | Company/contractor management | `http://localhost:3000/dashboard/companies` |
| Projects | Project/permit management | `http://localhost:3000/dashboard/projects` |
| Account | User profile | `http://localhost:3000/dashboard/account` |
| Subscription | Billing management | `http://localhost:3000/dashboard/subscription` |

### Key Patterns

- **Authentication:** Server-side Clerk validation (onboarding gates removed for MVP)
- **Runtime:** Node.js for all routes (data operations, security)
- **Error Handling:** Client-side boundaries with retry mechanisms
- **Loading States:** Suspense boundaries and skeleton UIs
- **Security:** No-cache, protected access, comprehensive guards

---

**Last updated: 2025-10-07**
