---
title: Entities
description: >-
  UI components for the components system, following atomic design principles.
  Located in dashboard/entities/.
last_updated: '2025-12-31'
category: components
status: draft
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `components/dashboard/entities`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Component Structure

### Shared Grid Components
Located in `components/dashboard/entities/shared/`:

- **`ag-grid-config.ts`**: Default AG Grid column and sidebar configuration utilities
- **`grid/entity-grid.tsx`**: Main EntityGrid component (AG Grid wrapper)
- **`grid/entity-grid-host.tsx`**: EntityGridHost wrapper component (manages state, error handling, search)
- **`grid/fetchers.ts`**: Client-safe entity fetcher factory (`createEntityFetcher`)
- **`grid/grid-menubar.tsx`**: GridMenubar component (toolbar with saved searches, tools, export)
- **`grid/use-grid-density.ts`**: Hook for managing grid density with localStorage persistence (flattened from hooks subdirectory)

### Per-Entity Configuration
Each entity (projects, addresses, companies) has its own `config.ts` that:
- Defines entity-specific column definitions
- Configures default sorting and UI options
- Wires up the fetcher using `createEntityFetcher`

### Architecture Notes
- Grid components follow a flattened structure (no nested subdirectories except `grid/`)
- All grid-related utilities are consolidated in `shared/grid/`
- Hook utilities are kept at the same level as components for easier maintenance
