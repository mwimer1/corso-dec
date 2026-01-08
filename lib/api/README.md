---
title: "API"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Edge-safe API utilities for HTTP responses, route wrappers, and error handling."
---
# API

Edge-safe API utilities for HTTP responses, route wrappers, and error handling.

## Runtime

**Runtime**: universal ⚠️

*No runtime-specific signals detected (likely universal/isomorphic)*

**Signals detected:**
- No runtime signals detected

## Directory Structure

```
lib/api/
├── ai/
│   └── chat/
├── shared/
│   └── response-types.ts
├── api-error.ts
├── auth-helpers.ts
├── client.ts
├── data.ts
├── dynamic-route.ts
├── edge-env.ts
├── edge-route.ts
├── edge.ts
├── http.ts
├── index.ts
├── mock-normalizers.ts
└── tenant-context-helpers.ts
```

## Public API

**Value exports** from `@/lib/api`:

- `badRequest`
- `error`
- `fetchJSON`
- `forbidden`
- `getEntityPage`
- `getEnvEdge`
- `http`
- `makeEdgeRoute`
- `noContent`
- `notFound`
- `ok`
- `postJSON`
- `readJsonOnce`
- `validateJson`
- `withErrorHandling`
- ... (2 more value exports)

**Type exports** from `@/lib/api`:

- `EdgeEnv` (type)

## Usage

```typescript
import { badRequest } from '@/lib/api';
```

```typescript
import type { EdgeEnv } from '@/lib/api';
```

