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
// ✅ Preferred: Direct imports
import type { Permission, Role, UserRole } from '@/types/auth/authorization/types';
import type { User } from '@/types/auth/user/types';
```

### ❌ Avoid

```typescript
// ❌ Barrel removed - do not use
import type { Permission } from '@/types/auth';
```

## Available Types

- `types/auth/authorization/types.ts` - RBAC types (Permission, Role, UserRole)
- `types/auth/user/types.ts` - User type definitions
- `types/auth/organization/types.ts` - Organization types
- `types/auth/member/types.ts` - Member types
- `types/auth/session/types.ts` - Session types
- `types/auth/credential/types.ts` - Credential types

## Note

Most user and session management is handled by Clerk (`@clerk/nextjs`). Custom types here extend Clerk's functionality for organization-scoped RBAC.
