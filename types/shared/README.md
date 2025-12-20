---
title: "types/shared"
last_updated: "2025-12-15"
category: "automation"
---

# Shared Types

Cross-cutting type definitions that are used across multiple domains.

## Ownership Principle

**Define types in the owning domain. Only promote to shared if the concept is truly cross-cutting or needed to break an unavoidable cycle. Do not duplicate domain-owned types into shared.**

Shared types should be:
- ✅ Truly cross-cutting (used by 3+ domains)
- ✅ Primitive utilities (dates, UI components, etc.)
- ✅ Infrastructure concerns (events, config)

Shared types should NOT be:
- ❌ Domain-specific types (auth, chat, security, validators)
- ❌ Duplicates of domain-owned types
- ❌ Convenience re-exports of domain types

## Import Patterns

**Prefer the barrel import** for shared types:

```typescript
// ✅ Preferred: Barrel import for shared types
import type { ISODateString, NavItemData, FeatureFlagConfig } from '@/types/shared';
```

Direct imports are also acceptable:

```typescript
// ✅ Also acceptable: Direct imports
import type { ISODateString } from '@/types/shared/utils/dates/types';
import type { NavItemData } from '@/types/shared/core/ui/types';
```

## Available Types

### Core Types
- `types/shared/core/entity/types.ts` - Entity row and page data types
- `types/shared/core/ui/types.ts` - UI component types (NavItemData, etc.)

### Utils Types
- `types/shared/utils/dates/types.ts` - Date utilities (ISODateString)

### Config Types
- `types/shared/config/base/types.ts` - Base configuration types (ValidatedEnv)

### Feature Flags
- `types/shared/feature-flags/types.ts` - Feature flag configuration

### System Types
- `types/shared/system/events/types.ts` - Domain events and handlers

### Custom Clerk Types
- `types/shared/custom-clerk.d.ts` - Clerk type augmentations

## Validation Types

Validation types are re-exported from `types/validators/` for convenience, but they are domain-owned. For new code, consider importing directly:

```typescript
// ✅ Preferred: Direct import from validators domain
import type { ValidationResult } from '@/types/validators/runtime/types';
import type { AllowedColumn } from '@/types/validators/sql-safety/types';

// ⚠️ Also available via shared (legacy)
import type { ValidationResult } from '@/types/shared';
```
