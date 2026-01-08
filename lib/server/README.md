---
title: "Server"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Server-only utilities for environment access, feature flags, database clients, and error handling."
---
# Server

Server-only utilities for environment access, feature flags, database clients, and error handling.

## Runtime

**Runtime**: server ✅

*Strong server-only signals detected*

**Signals detected:**
- import 'server-only'
- Imports from server-only module

## Directory Structure

```
lib/server/
├── db/
│   ├── supabase-tenant-client.ts
│   └── tenant-context.ts
├── env/
│   └── knobs.ts
├── errors/
│   └── error-utils.ts
├── feature-flags/
│   ├── builder.ts
│   ├── feature-flags.ts
│   └── resolvers.ts
├── shared/
│   ├── domain-configs.ts
│   ├── query-utils.ts
│   └── server.ts
├── subscription/
│   └── tier-limits.ts
├── utils/
│   └── timeout.ts
├── env.ts
├── index.ts
└── runtime.ts
```

## Public API

**Value exports** from `@/lib/server`:

- `ApplicationError`
- `buildFeatureFlags`
- `cacheKeyForSQL`
- `checkRateLimit`
- `clickhouse`
- `clickhouseQuery`
- `currentRuntime`
- `DEEP_RESEARCH_LIMITS`
- `DEFAULT_FLAGS`
- `ErrorCategory`
- `ErrorSeverity`
- `fail`
- `featureFlags`
- `formatErrorMessage`
- `getDeepResearchLimit`
- ... (13 more value exports)

**Type exports** from `@/lib/server`:

- `ApiError` (type)
- `ApiErrorCode` (type)

## Usage

```typescript
import { ApplicationError } from '@/lib/server';
```

```typescript
import type { ApiError } from '@/lib/server';
```

