---
title: "Api"
last_updated: "2026-01-07"
category: "types"
status: "active"
description: "TypeScript type definitions for types, ensuring type safety across the platform. Located in api/."
---
# Api

The `types/api` directory contains TypeScript **API contract types** for the Corso platform.

This is primarily the OpenAPI-generated contract surface, re-exported through a stable barrel so consumers don't deep-import generated files.

## Directory Structure

```
types/api/
generated/
  openapi.d.ts
index.ts
```

## Usage

### Canonical (preferred)

Import OpenAPI contract namespaces from the barrel:

```typescript
import type { paths, operations, components } from '@/types/api';
```

### Notes

- `types/api/generated/openapi.d.ts` is **AUTO-GENERATED** (do not edit).
- Prefer the barrel (`@/types/api`) in runtime code, tests, and docs examples to avoid path drift.
