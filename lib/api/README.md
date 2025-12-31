---
title: Api
description: Core lib utilities and functionality for the Corso platform. Located in api/.
last_updated: '2025-12-31'
category: library
status: draft
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `lib/api`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Component Structure

### API Utilities
Located in `lib/api/` (flattened from response and shared subdirectories):

- **`api-error.ts`**: Edge-safe API error types and `fail()` helper (flattened from response/)
- **`http.ts`**: HTTP response helpers (ok, badRequest, forbidden, notFound, noContent, error) - flattened from response/
- **`edge-route.ts`**: Edge route builder utility (`makeEdgeRoute`) - flattened from shared/
- **`client.ts`**: Client-side fetch utilities (fetchJSON, postJSON)
- **`data.ts`**: Entity data fetching with mock support
- **`edge-env.ts`**: Edge-safe environment variable access
- **`edge.ts`**: Edge-safe barrel exports
- **`mock-normalizers.ts`**: Mock data normalization utilities
- **`index.ts`**: Main barrel export (edge-safe API utilities)

### Architecture Notes
- API utilities follow a flattened structure (no nested subdirectories)
- All HTTP response helpers are at the root level for easier maintenance
- Edge-safe utilities are clearly separated from server-only code
- Barrel exports maintain edge compatibility
