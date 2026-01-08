---
title: "Api"
last_updated: "2026-01-08"
category: "types"
status: "active"
description: "TypeScript API contract types (OpenAPI) for the Corso platform."
---

# Api

The `types/api` directory contains TypeScript **API contract types** for the Corso platform.

This is primarily the OpenAPI-generated contract surface, re-exported through a stable barrel so consumers don't deep-import generated files.

## Directory Structure

```txt
types/api/
  generated/
    openapi.d.ts  # AUTO-GENERATED - do not edit
  index.ts        # Stable barrel - canonical import surface
  README.md
```

## Usage

### ✅ Canonical Import (Required)

Always import from the barrel `@/types/api` in runtime code, tests, and documentation examples:

```typescript
import type { paths, operations, components } from '@/types/api';
```

**Do not** deep-import from `@/types/api/generated/openapi` — this path may change and breaks the stable API contract.

## Notes

- `types/api/generated/openapi.d.ts` is **AUTO-GENERATED** (do not edit).
- `@/types/api` is the canonical import surface — always use this barrel export.
- The barrel re-exports `components`, `operations`, and `paths` from the generated file.
