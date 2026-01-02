---
status: "draft"
last_updated: "2026-01-02"
category: "types"
title: "Supabase"
description: "TypeScript type definitions for types, ensuring type safety across the platform. Located in supabase/."
---
# Supabase Types

> **Type definitions for Supabase database schema, API responses, and SQL execution configuration.**

This directory contains TypeScript type definitions for Supabase integration, including database schema types, API response types, and SQL execution configuration. These types ensure type-safe database operations throughout the Corso platform.

## 📋 Directory Structure

```
types/supabase/
├── index.ts                    # Barrel exports for all Supabase types
├── core/
│   └── types.ts               # Database schema interface (Database)
└── api/
    └── types.ts               # API response types (JWT exchange, SQL execution options)
```

| Directory | Purpose | Key Types |
|-----------|---------|-----------|
| `core/` | Database schema definitions | `Database` |
| `api/` | API response and execution types | `SupabaseApiJwtExchangeResponse`, `SQLExecutionOptions<T>` |

## 🔧 Core Database Types

### `core/types.ts`

Defines the main Supabase database schema interface used throughout the application for type-safe database operations.

#### `Database`

The main database schema interface that represents the structure of the Supabase database, including tables, views, functions, enums, and composite types.

```typescript
export interface Database {
  public: {
    Tables: {
      // Table definitions with Row, Insert, Update, Relationships
      chat_messages: { ... };
      user_preferences: { ... };
      subscriptions: { ... };
      // ... other tables
    };
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, unknown>;
  };
}
```

**Key Features:**
- Complete type coverage for all database tables
- Type-safe Row, Insert, and Update types for each table
- Relationships definitions for foreign key constraints
- JSON value type support for flexible data storage

**Tables Included:**
- `chat_messages` - AI chat conversation history
- `user_preferences` - User onboarding and preferences
- `subscriptions` - User subscription records
- `org_subscriptions` - Organization-level subscriptions
- `stripe_webhook_events` - Stripe webhook event tracking
- `clerk_webhook_events` - Clerk webhook event tracking
- `checkout_sessions` - Stripe payment sessions
- `saved_views` - User dashboard configurations
- `watchlists` - User project watchlists (deprecated)
- `saved_files` - User file storage
- `projects` - Projects (org-scoped)
- `subscription_trials` - Subscription trial tracking

**Usage:**
```typescript
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Type-safe Supabase client
const client: SupabaseClient<Database, 'public'> = createClient(...);

// Type-safe queries with autocomplete
const { data } = await client
  .from('chat_messages')
  .select('*')
  .eq('user_id', userId);
// data is typed as chat_messages Row[] | null
```

**Type Generation:**
These types can be generated from your Supabase schema using:
```bash
supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > types/supabase/core/types.ts
```

For local development:
```bash
supabase gen types typescript --local > types/supabase/core/types.ts
```

**Important Notes:**
- The `Database` interface should be kept in sync with your actual Supabase schema
- When schema changes occur, regenerate types using the Supabase CLI
- All table definitions include `Row`, `Insert`, and `Update` types for type-safe operations
- JSON fields use a custom `Json` type that supports nested structures

## 🌐 API Types

### `api/types.ts`

Type definitions for Supabase API responses and SQL execution configuration.

#### `SupabaseApiJwtExchangeResponse`

Response shape returned by Supabase auth API when exchanging JWTs (e.g., `POST /auth/v1/token?grant_type=password`).

```typescript
export interface SupabaseApiJwtExchangeResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number; // seconds
  refresh_token: string;
  /** Raw user payload - depends on your Supabase auth setup */
  user: unknown;
}
```

**Usage:**
```typescript
import type { SupabaseApiJwtExchangeResponse } from '@/types/supabase';

// Type-safe API response handling
const response: SupabaseApiJwtExchangeResponse = await fetch(...);
const { access_token, expires_in } = response;
```

**Properties:**
- `access_token`: JWT access token for authenticated requests
- `token_type`: Always `'bearer'` for Supabase
- `expires_in`: Token expiration time in seconds
- `refresh_token`: Token for refreshing the access token
- `user`: Raw user payload (structure depends on auth configuration)

#### `SQLExecutionOptions<T>`

Generic options interface for SQL execution helpers that supports timeout configuration, empty result handling, and row transformation.

```typescript
export interface SQLExecutionOptions<T = unknown> {
  /**
   * Milliseconds before the request is aborted
   * (defaults to 30,000 ms if omitted).
   */
  timeout?: number;

  /** Throw if the query returns zero rows (default: false). */
  throwOnEmpty?: boolean;

  /**
   * Optional transformer applied to every row.
   */
  transform?: (_row: unknown) => T;
}
```

**Usage:**
```typescript
import type { SQLExecutionOptions } from '@/types/supabase';

interface ProjectRow {
  id: string;
  name: string;
  status: string;
}

const options: SQLExecutionOptions<ProjectRow> = {
  timeout: 10000,
  throwOnEmpty: true,
  transform: (row) => ({
    id: row.id as string,
    name: row.name as string,
    status: row.status as string,
  }),
};

// Use with SQL execution helper
const projects = await executeSQL<ProjectRow>(query, options);
```

**Properties:**
- `timeout`: Request timeout in milliseconds (default: 30,000)
- `throwOnEmpty`: Whether to throw an error if query returns no rows (default: false)
- `transform`: Optional function to transform each row to a specific type

**Characteristics:**
- Generic type parameter allows type-safe row transformation
- Supports custom timeout configuration for long-running queries
- Optional empty result validation for strict query requirements
- Used by SQL execution utilities for consistent error handling

## 📊 Usage Examples

### Type-Safe Database Queries

```typescript
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Create typed Supabase client
const client: SupabaseClient<Database, 'public'> = getSupabaseClient();

// Type-safe select with autocomplete
const { data, error } = await client
  .from('chat_messages')
  .select('id, user_id, content, role')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50);

// data is typed as chat_messages Row[] | null
if (data) {
  data.forEach(message => {
    console.log(message.content); // Type-safe property access
    console.log(message.role); // 'user' | 'assistant' | 'system'
  });
}
```

### Tenant-Scoped Database Operations

```typescript
import type { Database } from '@/types/supabase';
import { getTenantScopedSupabaseClient } from '@/lib/server/db/supabase-tenant-client';

// Get tenant-scoped client with RLS context
const client = await getTenantScopedSupabaseClient(req);

// Type-safe queries automatically filtered by org_id/user_id via RLS
const { data } = await client
  .from('projects')
  .select('*')
  .eq('status', 'active');
// Only returns projects for the current tenant
```

### Type-Safe Inserts and Updates

```typescript
import type { Database } from '@/types/supabase';

type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];
type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update'];

// Type-safe insert
const newMessage: ChatMessageInsert = {
  user_id: userId,
  session_id: sessionId,
  role: 'user',
  content: 'Hello, world!',
  // created_at is optional (auto-generated)
};

await client.from('chat_messages').insert(newMessage);

// Type-safe update (partial)
const update: ChatMessageUpdate = {
  content: 'Updated message',
  // Only update specific fields
};
await client.from('chat_messages').update(update).eq('id', messageId);
```

### API Response Handling

```typescript
import type { SupabaseApiJwtExchangeResponse } from '@/types/supabase';

async function exchangeJWT(token: string): Promise<string> {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }
  );

  const data: SupabaseApiJwtExchangeResponse = await response.json();
  return data.access_token;
}
```

## 🎯 Usage Guidelines

### ✅ **Do**
- Import types from `@/types/supabase` barrel exports
- Use `Database` type with Supabase client for type-safe queries
- Keep types in sync with actual database schema
- Use `SQLExecutionOptions` for consistent SQL execution patterns
- Leverage Row/Insert/Update types for type-safe database operations

### ❌ **Don't**
- Don't modify generated types manually (regenerate from schema)
- Don't bypass type safety with `any` or type assertions
- Don't import directly from subdirectories when barrel exports exist
- Don't create duplicate type definitions for database tables

## 🔄 Type Generation

### Generating Types from Supabase Schema

**Production (Linked Project):**
```bash
supabase gen types typescript --linked > types/supabase/core/types.ts
```

**Local Development:**
```bash
supabase gen types typescript --local > types/supabase/core/types.ts
```

**Using Environment Variables:**
```bash
pnpm dlx supabase gen types typescript --env-file .env > types/supabase/core/types.ts
```

**Verification:**
After generating types, verify they're up to date:
```bash
git diff --exit-code -- types/supabase/core/types.ts
```

### Keeping Types Updated

- **Schema changes**: Regenerate types after any database schema changes
- **CI/CD**: Consider adding type generation to CI pipeline
- **Pre-commit**: Validate types are up to date before commits
- **Documentation**: Update this README when new tables/types are added

## 📚 Related Documentation

- [Supabase Integration](../../supabase/README.md) - Database setup and configuration
- [Tenant-Scoped Database Client](../../lib/server/db/supabase-tenant-client.ts) - RLS context and tenant isolation
- [Supabase Server Integration](../../lib/integrations/supabase/server.ts) - Server-side Supabase client setup
- [Type System Overview](../../docs/typescript/typescript-guide.md) - Overall type system architecture
- [Database Schema](../../supabase/README.md#database-schema) - Complete database schema documentation

## 🏷️ Tags

`#types` `#supabase` `#database` `#typescript` `#schema`

---

_Last updated: 2026-01-16 (Created comprehensive Supabase types documentation)_
