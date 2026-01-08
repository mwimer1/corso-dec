---
title: "Types"
last_updated: "2026-01-07"
category: "types"
status: "active"
description: "TypeScript type definitions for types, ensuring type safety across the platform."
---
# Types

The types directory contains TypeScript type definitions for the Corso platform.

TypeScript type definitions for types, ensuring type safety across the platform.

## Directory Structure

```
types/
api/
  api/generated/
  api/index.ts
chat/
  chat/index.ts
  chat/message/
  chat/query/
  chat/response/
dashboard/
  dashboard/analytics/
  dashboard/entity-grid.ts
  dashboard/index.ts
forms/
  forms/index.ts
  forms/types.ts
marketing/
  marketing/contact/
  marketing/index.ts
  marketing/insights/
  marketing/landing/
  marketing/permit-data/
  marketing/use-cases.ts
shared/
  shared/analytics/
  shared/auth/
  shared/config/
  shared/core/
  shared/dates/
  shared/feature-flags/
  shared/index.ts
... (6 more items)
```

## Usage

Import types from the appropriate subdirectory:

```typescript
import type { TypeName } from '@/types/subdirectory';
```

