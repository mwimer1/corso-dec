---
title: "types/dashboard"
last_updated: "2025-12-15"
category: "automation"
---

# Dashboard Types

Type definitions for dashboard features, analytics, and entity grids.

## Import Patterns

**Prefer direct imports** from the specific type file:

```typescript
// ✅ Preferred: Direct imports
import type { BaseRow, ProjectRow, CompanyRow, AddressRow } from '@/types/dashboard/analytics/types';
import type { EntityGridConfig, EntityGridProps } from '@/types/dashboard';
```

The `types/dashboard/index.ts` barrel is maintained for convenience but direct imports are also acceptable.

## Analytics Types

Analytics types are located at:
- `types/dashboard/analytics/types.ts` - Warehouse entity types for ClickHouse data structures

These include:
- `BaseRow` - Common audit columns returned by the warehouse
- `ProjectRow` - Project entity type
- `CompanyRow` - Company entity type
- `AddressRow` - Address entity type

## Entity Grid Types

Entity grid types are located at:
- `types/entity-grid.ts` - AG Grid configuration and props types
- Re-exported via `types/dashboard/index.ts` for convenience

These include:
- `EntityGridConfig` - Grid configuration
- `EntityGridProps` - Grid component props
- `EntityFetcher` - Data fetching function type
- `GridId` - Supported grid entity IDs
