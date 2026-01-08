---
title: "Shared"
description: "TypeScript type definitions for types, ensuring type safety across the platform. Located in shared/."
last_updated: "2026-01-07"
category: "types"
status: "active"
---
# Shared Types

> **Cross-cutting type definitions used across the Corso platform.**

This directory contains shared TypeScript type definitions that are used across multiple domains and features. These types represent common primitives, configuration structures, and cross-cutting concerns.

## 📋 Directory Structure

| Directory | Purpose | Key Types |
|-----------|---------|-----------|
| `config/` | Environment and configuration types | `ValidatedEnv` |
| `core/` | Core foundational types | `Row`, `NavItemData`, `BreadcrumbItem` |
| `dates/` | Date and time type definitions | `ISODateString` |
| `validation/` | Validation result types | `DomainValidationResult` |
| `feature-flags/` | Feature flag configuration types | `FeatureFlagConfig` |
| `analytics/` | Analytics window type definitions | Window extensions |
| `auth/` | Authentication type definitions | Clerk types |

## 🔧 Configuration Types

### `config/types.ts`

Defines the `ValidatedEnv` interface, which represents the structure of validated environment variables used throughout the application.

**Key Features:**
- Environment variable structure after validation
- Flat shape used across the app
- Comprehensive coverage of all environment variables (Node/Next, build metadata, public app meta, vendor keys, service keys, etc.)

**Usage:**
```typescript
import type { ValidatedEnv } from '@/types/shared/config/types';

// Used by getEnv() helpers to provide type-safe environment access
```

**Categories:**
- **Node/Next environment**: `NODE_ENV`, `NEXT_RUNTIME`, `VERCEL_ENV`, etc.
- **Build metadata**: `npm_package_version`
- **Public app meta**: `NEXT_PUBLIC_STAGE`, `NEXT_PUBLIC_SITE_URL`, etc.
- **Public vendor keys**: Supabase, Stripe, Sentry, Turnstile, Clerk publishable keys
- **Service keys**: OpenAI, ClickHouse, Stripe, Supabase service keys
- **Mock flags**: `CORSO_USE_MOCK_DB`, `CORSO_USE_MOCK_CMS`
- **CMS configuration**: Directus connection settings
- **Security**: CORS, CSP configuration
- **Caching**: Presence cache settings

## 📦 Core Types

Core foundational types used across dashboard features, analytics, chat, widgets, and UI components.

### `core/entity/types.ts`

Shared dashboard-entity primitives for entity tables and data loaders.

**Key Types:**

#### `Row`
Generic row type for entity tables/views. Represents a single row returned from any entity query.

```typescript
export type Row = Record<string, unknown>;
```

**Usage:**
```typescript
import type { Row } from '@/types/shared';

// Used for generic entity table rows
const projectRow: Row = { id: 1, name: 'Project', status: 'active' };
```

**Characteristics:**
- Flexible: Accepts any key-value pairs
- Used across dashboard features (analytics, chat, widgets)
- Centralized to avoid type drift across domains

### `core/ui/types.ts`

Core UI interface types used across navigation and UI components.

#### `NavItemData`
Navigation item structure for navigation menus and links.

```typescript
export interface NavItemData {
  href: string;
  label: string;
  external?: boolean;
}
```

**Usage:**
```typescript
import type { NavItemData } from '@/types/shared';

const navItem: NavItemData = {
  href: '/dashboard',
  label: 'Dashboard',
  external: false,
};
```

**Properties:**
- `href`: Navigation target URL (required)
- `label`: Display text for the navigation item (required)
- `external`: Whether the link opens in a new window/tab (optional, defaults to `false`)

**Use Cases:**
- Navigation menu items
- Sidebar navigation
- Footer links

#### `BreadcrumbItem`
Breadcrumb item structure for navigation trails.

```typescript
export interface BreadcrumbItem {
  label: string;
  href?: string;
}
```

**Usage:**
```typescript
import type { BreadcrumbItem } from '@/types/shared';

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Corso', href: '/dashboard/chat?new=true' },
  { label: 'Projects', href: '/dashboard/projects' },
];
```

**Properties:**
- `label`: Display text for the breadcrumb item (required)
- `href`: Optional navigation target URL (if omitted, item is non-clickable)

**Use Cases:**
- Dashboard breadcrumb navigation
- Page hierarchy trails

## 📅 Date Types

Date and time type definitions for standardized date representation across the application.

### `dates/types.ts`

Shared date type definitions for ISO-8601 date strings.

#### `ISODateString`

A string type representing dates or date-times in ISO-8601 format.

```typescript
export type ISODateString = string;
```

**Format Examples:**
- Date only: `"2025-08-01"`
- Date-time with timezone: `"2025-08-01T12:34:56Z"`
- Date-time with offset: `"2025-08-01T12:34:56+00:00"`

**Usage:**
```typescript
import type { ISODateString } from '@/types/shared';

// Type-safe date string
const createdAt: ISODateString = '2025-01-16T10:30:00Z';

// Interface with date fields
interface BaseRow {
  id: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}
```

**Characteristics:**
- Represents dates as ISO-8601 formatted strings
- Used for API responses, database timestamps, and data serialization
- Compatible with JavaScript `Date` object (can be parsed with `new Date()`)
- Ensures consistent date format across the application

**Use Cases:**
- Database timestamp columns (`created_at`, `updated_at`)
- API response date fields
- Chat message timestamps
- Analytics date ranges
- Audit trail timestamps

**Important Notes:**
- Always use `ISODateString` for date fields in shared interfaces
- Dates should be in UTC when possible (use `Z` suffix)
- For date-only values (no time), use format `YYYY-MM-DD`
- For date-time values, always include timezone information

## 🔄 Validation Types

Validation result types for domain configuration validation.

### `validation/types.ts`

Shared validation types for domain configuration validation.

**Key Types:**

#### `DomainValidationResult`

Detailed validation information for a single domain (e.g. lib/features/chat).

```typescript
export interface DomainValidationResult {
  domain: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingOptional: string[];
}
```

**Usage:**
```typescript
import type { DomainValidationResult } from '@/types/shared';

// Used by domain configuration validators
const result: DomainValidationResult = {
  domain: 'lib/core/security',
  isValid: true,
  errors: [],
  warnings: [],
  missingRequired: [],
  missingOptional: ['TURNSTILE_SECRET_KEY'],
};
```

**Properties:**
- `domain`: Folder or capability this validation refers to
- `isValid`: Whether the domain config passes validation
- `errors`: Fatal errors that must be fixed
- `warnings`: Non-blocking issues worth addressing
- `missingRequired`: Missing required environment variables
- `missingOptional`: Missing optional (but recommended) variables

**Use Cases:**
- Domain configuration validation
- Environment variable verification
- Startup health checks

## 🎯 Usage Guidelines

### ✅ **Do**
- Import shared types from `@/types/shared` barrel exports
- Use shared types for cross-cutting concerns
- Keep domain-specific types in their respective domain folders

### ❌ **Don't**
- Re-export domain-owned types (auth, chat, security) to prevent cycles
- Create duplicate type definitions when shared types exist
- Import directly from subdirectories when barrel exports are available

## 📚 Related Documentation

- [Type System Overview](../../docs/types.md) - Overall type system architecture
- [Environment Configuration](../../docs/development/setup-guide.md) - Environment variable setup
- [Validation Patterns](../../docs/validation.md) - Type validation strategies

## 🏷️ Tags

`#types` `#shared-types` `#typescript` `#configuration`

---

_Last updated: 2026-01-07 (Removed unused types: GetEntityPageDataParams, DomainEvent, EventHandler, ChatAIErrorPayload, ChatMessageProcessedPayload, ValidationState, ConfigValidationHookResult)_
