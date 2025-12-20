---
title: "types/integrations"
last_updated: "2025-12-15"
category: "automation"
---

# Integration Types

Type definitions for third-party service integrations.

## Import Patterns

**Prefer direct imports** from the specific type file. While `types/integrations/index.ts` barrel exists, direct imports are recommended to prevent circular dependencies.

```typescript
// ✅ Preferred: Direct imports
import type { Database } from '@/types/integrations/supabase/core/types';
import type { SQLExecutionOptions, SupabaseApiJwtExchangeResponse } from '@/types/integrations/supabase/api/types';
```

### ⚠️ Barrel Available (but discouraged)

```typescript
// ⚠️ Barrel exists but direct imports preferred
import type { Database } from '@/types/integrations';
```

## Available Types

- `types/integrations/supabase/core/types.ts` - Supabase core types (Database)
- `types/integrations/supabase/api/types.ts` - Supabase API types (SQLExecutionOptions, SupabaseApiJwtExchangeResponse)

## Note

Clerk types are consumed directly from `@clerk/nextjs` and `@clerk/backend` - no custom types needed here.

OpenAI, Redis, and ClickHouse integration types were removed as unused exports.
