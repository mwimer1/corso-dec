---
title: "Entities"
description: "UI components for the components system, following atomic design principles. Located in dashboard/entities/."
last_updated: "2025-12-31"
category: "components"
status: "draft"
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
- **`entity-grid.tsx`**: Main EntityGrid component (AG Grid wrapper)
- **`entity-grid-host.tsx`**: EntityGridHost wrapper component (manages state, error handling, search)
- **`fetchers.ts`**: Client-safe entity fetcher factory (`createEntityFetcher`)
- **`grid-menubar.tsx`**: GridMenubar component (toolbar with saved searches, tools, export)
- **`use-grid-density.ts`**: Hook for managing grid density with localStorage persistence

### Per-Entity Configuration
Each entity (projects, addresses, companies) has its own `config.ts` that:
- Defines entity-specific column definitions
- Configures default sorting and UI options
- Wires up the fetcher using `createEntityFetcher`

### Architecture Notes
- Grid components follow a fully flattened structure (all files at `shared/` level)
- All grid-related components and utilities are in `shared/` directory for easy discoverability
- Related files remain grouped together (all grid-related files are visible at the same level)
