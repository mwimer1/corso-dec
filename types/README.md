---
title: "types"
last_updated: "2025-12-15"
category: "automation"
---

# Type Definitions

This directory contains all TypeScript type definitions for the Corso codebase, organized by domain.

## Import Policy

**Prefer direct file imports** from the canonical type file location. Avoid using domain barrel files (`index.ts`) to prevent circular dependencies and maintain clear type ownership.

### ✅ Preferred Import Patterns

```typescript
// Direct imports from canonical locations
import type { Permission } from '@/types/auth/authorization/types';
import type { ISODateString } from '@/types/shared/utils/dates/types';
import type { ChatMessage } from '@/types/chat/message/types';
import type { Database } from '@/types/integrations/supabase/core/types';
import type { EntityGridConfig } from '@/types/dashboard'; // Dashboard barrel maintained for convenience
import type { BaseRow } from '@/types/dashboard/analytics/types'; // Direct import preferred
```

### ❌ Avoid These Patterns

```typescript
// Domain barrel imports (removed/discouraged)
import type { Permission } from '@/types/auth';           // ❌ Barrel removed
import type { Something } from '@/types/chat';            // ❌ Use direct path
import type { Something } from '@/types/integrations';   // ❌ Use direct path
import type { Something } from '@/types/validators';      // ❌ Barrel removed
```

**Rationale:** Domain barrels (`types/<domain>/index.ts`) were removed or discouraged due to circular-dependency risk and unclear public surface area. Direct imports keep ownership obvious and prevent accidental cycles.

### Shared Types

The `types/shared/` directory contains truly cross-cutting primitives (dates, UI nav, etc.). For shared types, you can use the barrel:

```typescript
import type { ISODateString, NavItemData } from '@/types/shared';
```

However, direct imports are also acceptable:

```typescript
import type { ISODateString } from '@/types/shared/utils/dates/types';
import type { NavItemData } from '@/types/shared/core/ui/types';
```

**Important:** Do not re-export domain-owned types (auth, chat, security, validators) from `types/shared`. Define types in their owning domain and import directly from there.

## Generated Types

Some type files are auto-generated and should not be edited manually:

- `types/api/openapi.d.ts` - Generated from OpenAPI specification
  - **DO NOT EDIT** - Regenerate via: `pnpm openapi:gen`
  - This file is regenerated automatically during `pnpm typecheck` (via `pretypecheck` hook)

## Directory Structure

- `types/auth/` - Authentication and authorization types
- `types/chat/` - Chat and query types
- `types/dashboard/` - Dashboard and analytics types
- `types/integrations/` - Third-party integration types
- `types/api/` - API contract types (OpenAPI generated)
- `types/shared/` - Cross-cutting shared primitives
- `types/security/` - Security and policy types
- `types/validators/` - Validation and SQL safety types
