---
title: "Shared"
description: "Cross-domain shared utilities safe for client and server use."
last_updated: "2026-01-07"
category: "library"
status: "active"
---
# Shared Library

Cross-domain shared utilities safe for client and server use. Provides caching, validation, analytics, error handling, and other cross-cutting concerns.

## Overview

The `lib/shared/` directory provides:
- **Caching**: LRU cache and simple cache managers
- **Validation**: Zod schema validation helpers
- **Analytics**: Client-safe analytics tracking
- **Error handling**: Client-safe error utilities
- **Feature flags**: Client-safe feature flag access
- **Format utilities**: Number and date formatting

## Directory Structure

```
lib/shared/
├── analytics/         # Analytics tracking
│   └── track.ts
├── assets/            # Asset utilities (CDN)
│   └── cdn.ts
├── cache/             # Caching utilities
│   ├── lru-cache.ts
│   └── simple-cache.ts
├── config/            # Client-safe configuration
│   ├── auth-mode.ts
│   └── client.ts
├── constants/          # Shared constants
│   └── links.ts
├── env/               # Environment utilities
│   └── is-development.ts
├── errors/            # Error handling
│   ├── api-error-conversion.ts
│   ├── application-error.ts
│   ├── error-utils.ts
│   ├── reporting.ts
│   ├── security-validation-error.ts
│   ├── type-guards.ts
│   ├── types.ts
│   └── validation-error.ts
├── feature-flags/     # Feature flags
│   ├── core.ts
│   └── feature-flags.ts
├── format/            # Format utilities
│   └── numbers.ts
├── log.ts             # Logging utilities
├── index.ts           # Barrel exports
└── validation/        # Validation utilities
    └── assert.ts
```

## Key Features

### Caching

High-performance caching utilities:

```typescript
import { LRUCache, simpleCacheManager } from '@/lib/shared';

// LRU Cache
const cache = new LRUCache<string, number>({ max: 100 });
cache.set('key', 42);
const value = cache.get('key');

// Simple cache manager
const manager = simpleCacheManager({ ttl: 60000 });
await manager.set('key', data);
const data = await manager.get('key');
```

### Analytics Tracking

Client-safe analytics tracking:

```typescript
import { trackNavClick, trackEvent } from '@/lib/shared/analytics/track';

trackNavClick('Features', '/#features');
trackEvent('button_click', { button: 'signup' });
```

### Validation

Zod schema validation helpers:

```typescript
import { assertZodSchema } from '@/lib/shared/validation/assert';

const result = assertZodSchema(Schema, data);
// Throws ValidationError if invalid
```

### Error Handling

Client-safe error utilities:

```typescript
import { ApplicationError, ErrorCategory } from '@/lib/shared/errors';

throw new ApplicationError({
  message: 'Something went wrong',
  category: ErrorCategory.Validation
});
```

## Runtime

**Runtime**: Universal (client and server)

All utilities in this module are designed to be safe for use in both client components and server components.

## Related Documentation

- [Analytics Tracking](../../.cursor/rules/analytics-tracking.mdc) - Analytics patterns
- [Lib Overview](../README.md) - Core library documentation
- [Error Handling](../../docs/error-handling/error-handling-guide.md) - Error handling patterns

---

**Last Updated**: 2026-01-07  
**Maintained By**: Platform Team  
**Status**: Active
