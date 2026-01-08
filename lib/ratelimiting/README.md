---
title: "Rate Limiting"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Rate limiting utilities with memory and Redis store adapters."
---
# Rate Limiting

Rate limiting utilities with memory and Redis store adapters.

## Runtime

**Runtime**: client ❓

*Some client-only signals detected*

**Signals detected:**
- Uses browser global: window

> **Note**: Runtime detection is uncertain. Verify compatibility before use.

## Directory Structure

```
lib/ratelimiting/
├── actions.ts
├── core.ts
├── fixed-window.ts
├── index.ts
├── key.ts
├── memory.ts
├── redis.ts
├── server.ts
├── store.ts
└── types.ts
```

## Public API

**Value exports** from `@/lib/ratelimiting`:

- `ACTION_RATE_LIMITS`
- `buildCompositeKey`
- `checkRateLimit`
- `createMemoryStore`
- `createRedisStore`
- `executeRateLimit`
- `fixedWindowRateLimit`
- `getDefaultStore`
- `rateLimit`
- `resetDefaultStore`
- `withRateLimit`

**Type exports** from `@/lib/ratelimiting`:

- `DomainRateLimits` (type)
- `RateLimitOptions` (type)
- `RateLimitResult` (type)
- `StoreAdapter` (type)

## Usage

```typescript
import { ACTION_RATE_LIMITS } from '@/lib/ratelimiting';
```

```typescript
import type { DomainRateLimits } from '@/lib/ratelimiting';
```

