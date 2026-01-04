---
title: "Shared"
description: "TypeScript type definitions for types, ensuring type safety across the platform. Located in shared/."
last_updated: "2026-01-04"
category: "types"
status: "draft"
---
# Shared Types

> **Cross-cutting type definitions used across the Corso platform.**

This directory contains shared TypeScript type definitions that are used across multiple domains and features. These types represent common primitives, configuration structures, and cross-cutting concerns.

## 📋 Directory Structure

| Directory | Purpose | Key Types |
|-----------|---------|-----------|
| `config/` | Environment and configuration types | `ValidatedEnv` |
| `core/` | Core foundational types | `Row`, `GetEntityPageDataParams`, `NavItemData` |
| `dates/` | Date and time type definitions | `ISODateString` |
| `system/` | System-level event and domain types | `DomainEvent`, `EventHandler` |
| `validation/` | Validation result types | `ValidationState`, `DomainValidationResult` |
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

#### `GetEntityPageDataParams`
Parameters accepted by entity-page data loaders.

```typescript
export interface GetEntityPageDataParams {
  /** Name of the table or view (e.g. "projects", "companies") */
  entity: string;
}
```

**Usage:**
```typescript
import type { GetEntityPageDataParams } from '@/types/shared';

// Parameters for entity data loading
const params: GetEntityPageDataParams = { entity: 'projects' };
```

**Purpose:**
- Standardizes entity data loader interface
- Used by dashboard entity query routes
- Ensures consistent entity naming across the application

**Important Notes:**
- All domain-specific folders should import these types rather than redefining their own to avoid drift
- Entity names must match the actual table/view names in the database

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
- Breadcrumb navigation
- Footer links

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

## 🔄 System Types

System-level event and domain types for event-driven architecture patterns.

### `system/types.ts`

Shared system types for domain events and event handling patterns.

**Key Types:**

#### `DomainEvent<T>`

Generic domain event structure for event-driven architecture.

```typescript
export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  source?: string;
}
```

**Usage:**
```typescript
import type { DomainEvent } from '@/types/shared';

// Create a typed domain event
const userCreatedEvent: DomainEvent<{ userId: string; email: string }> = {
  type: 'user.created',
  payload: { userId: 'user_123', email: 'user@example.com' },
  timestamp: Date.now(),
  source: 'auth-service',
};
```

**Properties:**
- `type`: Event type identifier (required)
- `payload`: Event data of type `T` (required)
- `timestamp`: Unix timestamp in milliseconds (required)
- `source`: Optional source identifier for event origin

**Characteristics:**
- Generic type parameter allows type-safe event payloads
- Used for cross-domain communication and event sourcing
- Supports event-driven architecture patterns

#### `EventHandler<T>`

Event handler function signature for processing domain events.

```typescript
export type EventHandler<T = unknown> = (
  event: DomainEvent<T>
) => void | Promise<void>;
```

**Usage:**
```typescript
import type { EventHandler, DomainEvent } from '@/types/shared';

// Define an event handler
const handleUserCreated: EventHandler<{ userId: string }> = async (event) => {
  console.log('User created:', event.payload.userId);
  // Async processing...
};

// Use with event system
eventBus.on('user.created', handleUserCreated);
```

**Characteristics:**
- Can be synchronous or asynchronous (returns `void` or `Promise<void>`)
- Type-safe event handling with generic payload types
- Used by event bus implementations and event processors

#### `ChatMessageProcessedPayload`

Payload structure for chat message processed events.

```typescript
export interface ChatMessageProcessedPayload {
  userId: string;
  content: string;
  messageId?: string;
}
```

**Usage:**
```typescript
import type { DomainEvent, ChatMessageProcessedPayload } from '@/types/shared';

const chatEvent: DomainEvent<ChatMessageProcessedPayload> = {
  type: 'chat.message.processed',
  payload: {
    userId: 'user_123',
    content: 'Hello, world!',
    messageId: 'msg_456',
  },
  timestamp: Date.now(),
};
```

#### `ChatAIErrorPayload`

Payload structure for chat AI error events.

```typescript
export interface ChatAIErrorPayload {
  userId?: string;
  message: string;
}
```

**Usage:**
```typescript
import type { DomainEvent, ChatAIErrorPayload } from '@/types/shared';

const errorEvent: DomainEvent<ChatAIErrorPayload> = {
  type: 'chat.ai.error',
  payload: {
    userId: 'user_123',
    message: 'Failed to process message',
  },
  timestamp: Date.now(),
};
```

**Use Cases:**
- Event-driven architecture implementations
- Cross-domain communication
- Event sourcing patterns
- Chat message processing events
- AI error tracking and monitoring

**Important Notes:**
- Use `DomainEvent` for all domain events to ensure consistency
- Event handlers should be idempotent when possible
- Include source identifiers for traceability
- Use typed payloads for type safety

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

_Last updated: 2025-01-16 (Consolidated core types documentation, flattened utils/dates to dates and system/events to system, removed placeholder READMEs)_
