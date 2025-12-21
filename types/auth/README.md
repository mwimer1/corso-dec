---
title: "types/auth"
last_updated: "2025-12-15"
category: "automation"
---

# Auth Types

Type definitions for authentication, authorization, and user management.

## Import Patterns

**Prefer direct imports** from the specific type file. The `types/auth/index.ts` barrel was removed to prevent circular dependencies.

```typescript
// ✅ Preferred: Direct imports (when types exist)
// Note: Most auth types are provided by Clerk (@clerk/nextjs)
// Custom types are defined only when extending Clerk functionality
```

### ❌ Avoid

```typescript
// ❌ Barrel removed - do not use
import type { Permission } from '@/types/auth';
```

## Available Types

**Note:** Most authentication and authorization types are provided by Clerk (`@clerk/nextjs`). Custom types in this directory are only defined when extending Clerk's functionality for organization-scoped features.

Previously defined types (Permission, Role, UserRole) have been removed as they were unused in the codebase. If RBAC types are needed in the future, they should be defined based on actual usage requirements.

## Note

Most user and session management is handled by Clerk (`@clerk/nextjs`). Custom types here extend Clerk's functionality for organization-scoped RBAC.
