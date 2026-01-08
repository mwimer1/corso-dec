---
title: "Middleware"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Request middleware for error handling, rate limiting, and CORS."
---
# Middleware

Request middleware for error handling, rate limiting, and CORS.

## Runtime

**Runtime**: universal ⚠️

*No runtime-specific signals detected (likely universal/isomorphic)*

**Signals detected:**
- No runtime signals detected

## Directory Structure

```
lib/middleware/
├── edge/
│   ├── error-handler.ts
│   └── rate-limit.ts
├── node/
│   ├── with-error-handling-node.ts
│   └── with-rate-limit-node.ts
├── shared/
│   ├── cors.ts
│   ├── headers.ts
│   ├── rate-limit.ts
│   ├── request-id.ts
│   └── response-types.ts
├── index.ts
├── rate-limit-presets.ts
```

## Public API

**Value exports** from `@/lib/middleware`:

- `addRequestIdHeader`
- `corsHeaders`
- `getRequestId`
- `handleCors`
- `handleOptions`
- `RATE_LIMIT_100_PER_MIN`
- `RATE_LIMIT_30_PER_MIN`
- `RATE_LIMIT_60_PER_MIN`
- `withErrorHandlingEdge`
- `withErrorHandlingNode`
- `withRateLimitEdge`
- `withRateLimitNode`

## Usage

```typescript
import { addRequestIdHeader } from '@/lib/middleware';
```

