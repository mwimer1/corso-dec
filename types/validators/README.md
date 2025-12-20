---
title: "types/validators"
last_updated: "2025-12-15"
category: "automation"
---

# Validator Types

Type definitions for input validation, SQL safety, and runtime validation.

## Import Patterns

**Prefer direct imports** from the specific type file. The `types/validators/index.ts` barrel was removed to prevent circular dependencies.

```typescript
// ✅ Preferred: Direct imports
import type { ValidationResult } from '@/types/validators/runtime/types';
import type { AllowedColumn, AllowedTableName } from '@/types/validators/sql-safety/types';
```

### ❌ Avoid

```typescript
// ❌ Barrel removed - do not use
import type { ValidationResult } from '@/types/validators';
```

## Available Types

- `types/validators/runtime/types.ts` - Runtime validation types (ValidationResult, ValidationConfig, etc.)
- `types/validators/sql-safety/types.ts` - SQL safety types (AllowedColumn, AllowedTableName, WhereCondition)

## Note

Validation types are also re-exported from `types/shared/index.ts` for legacy compatibility, but new code should import directly from the validators domain.
