---
description: "Documentation and resources for documentation functionality."
last_updated: "2025-12-29"
category: "documentation"
status: "draft"
title: "App"
---
# App Directory — Next.js App Router Architecture

## 🚀 App Directory — Next.js App Router Architecture

Corso's Next.js 15 App Router foundation with file-system routing, nested layouts, comprehensive security, and production-ready patterns. All routes use Node.js runtime for Clerk compatibility and data operations.

## 📁 Directory Structure (Source of Truth)

```plaintext
app/
├── (auth)/                          # Authentication route group
│   ├── _theme.tsx                   # Auth theme provider
│   ├── error.tsx                    # Auth error boundary
│   ├── layout.tsx                   # Auth layout wrapper
│   ├── loading.tsx                  # Auth loading state
│   ├── route.config.ts              # Auth route configuration
│   ├── README.md                    # Auth routes documentation
│   ├── sign-in/                     # Sign-in pages
│   │   ├── layout.tsx               # Auth check, redirects if authenticated
│   │   └── [[...sign-in]]/page.tsx  # Clerk SignIn component
│   ├── sign-up/                     # Sign-up pages
│   │   ├── layout.tsx               # Auth check, redirects if authenticated
│   │   └── [[...sign-up]]/page.tsx  # Clerk SignUp component
├── (marketing)/                     # Public marketing pages
│   ├── _theme.tsx                   # Marketing theme provider
│   ├── error.tsx                    # Marketing error boundary
│   ├── layout.tsx                   # Marketing layout wrapper
│   ├── loading.tsx                  # Marketing loading state
│   ├── page.tsx                     # Landing page (/)
│   ├── route.config.ts              # Marketing route configuration
│   ├── README.md                    # Marketing routes documentation
│   ├── legal/                       # Legal pages index (navigation hub)
│   │   └── page.tsx                 # Legal index page
│   ├── terms/                       # Terms of Service
│   │   └── page.tsx                 # Terms content page
│   ├── privacy/                     # Privacy Policy
│   │   └── page.tsx                 # Privacy content page
│   ├── cookies/                     # Cookie Notice
│   │   └── page.tsx                 # Cookie content page
│   ├── contact/                     # Contact form and information
│   │   └── page.tsx                 # Contact form and info page
│   ├── insights/                    # Blog/insights section
│   │   ├── page.tsx                 # Insights index (static generation)
│   │   └── [slug]/                  # Article pages
│   │       ├── page.tsx             # Article with dynamic SEO metadata
│   │       └── not-found.tsx        # Invalid article handler
│   └── pricing/                     # Pricing pages
│       ├── page.tsx                 # Pricing plans with billing toggle
│       └── scroll-to-faq.tsx        # Client-side FAQ scroll helper
├── (protected)/                     # Authenticated application
│   ├── client.tsx                   # Protected client wrapper
│   ├── error.tsx                    # Protected error boundary
│   ├── layout.tsx                   # Auth guard + onboarding gate
│   ├── loading.tsx                  # Protected loading state
│   ├── route.config.ts              # Protected route configuration
│   ├── README.md                    # Protected routes documentation
│   ├── dashboard/                   # Main dashboard
│   │   ├── account/                 # User account management
│   │   │   ├── layout.tsx           # Account section layout
│   │   │   ├── page.tsx             # Clerk UserProfile integration
│   │   │   └── README.md            # Account documentation
│   │   ├── layout.tsx               # Dashboard layout with providers
│   │   ├── page.tsx                 # Analytics dashboard with widgets
│   │   ├── error.tsx                # Dashboard error boundary
│   │   ├── README.md                # Dashboard documentation
│   │   ├── chat/                    # AI chat interface
│   │   │   ├── page.tsx             # Chat window
│   │   │   ├── loading.tsx          # Chat loading state
│   │   │   └── error.tsx            # Chat error boundary
│   │   └── (entities)/              # Entity management routes
│   │       └── [entity]/            # Dynamic entity pages
│   │           ├── page.tsx         # Entity list page
│   │           └── loading.tsx      # Entity loading states
│   └── subscription/                # Billing management
│       ├── page.tsx                 # Personal subscription management
│       └── README.md                # Subscription documentation
├── api/                             # API routes
│   ├── README.md                    # API overview
│   ├── v1/                          # Public API v1
│   │   ├── README.md                # v1 API documentation
│   │   ├── csp-report/              # CSP violation reporting
│   │   │   └── route.ts             # POST /api/v1/csp-report
│   │   ├── entity/                  # Entity resource operations
│   │   │   └── [entity]/           # Dynamic entity operations
│   │   │       ├── route.ts         # GET /api/v1/entity/[entity]
│   │   │       ├── query/route.ts   # POST /api/v1/entity/[entity]/query
│   │   │       └── export/route.ts   # GET /api/v1/entity/[entity]/export
│   │   ├── ai/                      # AI helper endpoints
│   │   │   ├── generate-sql/route.ts # POST /api/v1/ai/generate-sql
│   │   │   └── generate-chart/route.ts # POST /api/v1/ai/generate-chart
│   │   └── user/route.ts            # POST /api/v1/user
│   ├── internal/                    # Internal endpoints
│   │   ├── README.md                # Internal API documentation
│   │   └── auth/route.ts            # POST /api/internal/auth (Clerk webhooks)
├── global-error.tsx                 # Global error boundary
├── layout.tsx                       # Root layout with providers
├── providers.tsx                    # React context providers
├── sitemap.ts                       # SEO sitemap generation
└── README.md                        # This file
```

## 🛣️ Route Groups → URLs

| Group | URLs | Purpose | Runtime | Auth Required |
|-------|------|---------|---------|---------------|
| `(marketing)` | `/`, `/legal`, `/terms`, `/privacy`, `/cookies`, `/contact`, `/pricing`, `/insights/*` | Public marketing, SEO-optimized | Node.js | No |
| `(auth)` | `/sign-in`, `/sign-up` | Authentication flow | Node.js | No |
| `(protected)` | `/dashboard/*`, `/dashboard/account`, `/dashboard/subscription` | Authenticated application | Node.js | Yes |

**Key Notes:**
- **All routes use Node.js runtime** for Clerk telemetry and data operations
- **Marketing**: Public access, SEO-optimized with static generation where possible. Legal pages (`/legal`, `/terms`, `/privacy`, `/cookies`, `/contact`) are static routes (not dynamic `[entity]/[page]` structure)
- **Auth**: Server-side guards prevent authenticated users from accessing auth pages
- **Protected**: Clerk session validation + onboarding completion gate (removed for MVP)
- **Themes**: Centralized via `RouteThemeProvider` setting `data-route-theme` attribute for CSS theming. Default theme is "protected" (set in root layout); auth and marketing groups override via `_theme.tsx`
- **Error Handling**: Standardized across groups using shared `ErrorFallback` component

## 🔐 Security & Authentication Patterns

### Authentication Flow
```typescript
// Server component auth check
const { userId } = await auth();
if (!userId) redirect('/sign-in');
```


### Environment Access
```typescript
// Centralized environment access (NEVER use process.env directly)
import { getEnv } from '@/lib/shared/env';
const apiKey = getEnv().OPENAI_API_KEY;
```

### Error Handling
- **Global boundary**: `app/global-error.tsx` for uncaught errors
- **Group boundaries**: Each route group has dedicated error handling
- **API errors**: Standardized via `http.ok()`/`http.error()` helpers

## 🌐 API Route Structure

### Public API (`/api/v1/*`)
- Versioned endpoints for external consumption
- Comprehensive OpenAPI documentation
- Rate limiting and input validation
- RBAC and tenant isolation

### Internal API (`/api/internal/*`)
- Webhooks, admin operations, privileged endpoints
- No OpenAPI documentation (internal only)
- Enhanced security and monitoring
- Node.js runtime for external integrations

### Public Endpoints (`/api/v1/csp-report`)
- CSP violation reporting via `/api/v1/csp-report`
- No authentication required
- Rate limited for abuse prevention

## 🧭 Key Files Reference

| File | Purpose | Key Features |
|------|---------|--------------|
| `layout.tsx` | Root layout | Providers, fonts, metadata, viewport config |
| `providers.tsx` | Context providers | Alert system, config provider, base contexts |
| `global-error.tsx` | Error boundary | Client-side error logging, user-friendly fallback |
| `sitemap.ts` | SEO sitemap | Dynamic generation for marketing pages |
| `(protected)/layout.tsx` | Auth guard | Clerk validation, onboarding gate |
| `(marketing)/page.tsx` | Landing page | Static generation, hero/product showcase |

## 📚 Architecture Documentation

| Topic | Location | Coverage |
|-------|----------|----------|
| Authentication routes | `app/(auth)/README.md` | Sign-in/up, onboarding flow, Clerk integration |
| Marketing pages | `app/(marketing)/README.md` | Landing, pricing, insights, entity pages |
| Protected app | `app/(protected)/README.md` | Dashboard, account, subscription management |
| API routes | `app/api/README.md` | Endpoint overview, security patterns |
| v1 API | `app/api/v1/README.md` | Public API documentation |
| Internal API | `app/api/internal/README.md` | Internal endpoints, webhooks |

## 🏃 Development Workflow

### Local Development
```bash
# Start development server
# Automatically cleans ports (3000, 9323) and orphaned processes before starting
pnpm dev

# TypeScript validation
pnpm typecheck

# Lint and format
pnpm lint

# Run tests
pnpm test
```

### Quality Gates
```bash
# Full quality check (local)
pnpm quality:local

# TypeScript validation
pnpm typecheck

# Security and pattern validation
pnpm validate:cursor-rules
```

## 🔧 Key Implementation Patterns

### Server Components
- Use `auth()` from `@clerk/nextjs/server` for authentication
- Handle async `params`/`searchParams` properly
- Implement proper error boundaries and loading states

### Route Configuration
```typescript
// Route metadata and configuration
export const metadata: Metadata = {
  title: 'Page Title | Corso',
  description: 'Page description for SEO',
};

export const runtime = 'nodejs'; // All routes use Node.js
```

### Dynamic Routing
```typescript
// Handle dynamic params with proper validation
export default async function DynamicPage({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  // Validate and handle invalid params
}
```

---

**Last updated:** 2025-10-07
