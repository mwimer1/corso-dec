---
title: "Actions"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Server action utilities for validation, error handling, and rate limiting."
---
# Actions

Server action utilities for validation, error handling, and rate limiting.

## Runtime

**Runtime**: universal ⚠️

*No runtime-specific signals detected (likely universal/isomorphic)*

**Signals detected:**
- No runtime signals detected

## Directory Structure

```
lib/actions/
├── error-handling.ts
├── index.ts
└── validation.ts
```

## Public API

**Value exports** from `@/lib/actions`:

- `ACTION_RATE_LIMITS`
- `ApplicationError`
- `checkRateLimit`
- `ErrorCategory`
- `ErrorSeverity`
- `handleInternalError`
- `handleValidationError`
- `validateInput`
- `withErrorHandling`

**Type exports** from `@/lib/actions`:

- `ErrorContext` (type)

## Usage

```typescript
import { ACTION_RATE_LIMITS } from '@/lib/actions';
```

```typescript
import type { ErrorContext } from '@/lib/actions';
```

