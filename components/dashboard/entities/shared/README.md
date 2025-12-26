# Entity Grid Shared Components

## Purpose

Shared infrastructure for entity grid system: AG Grid configuration, fetchers, and renderers.

## Key Files

- `grid/entity-grid.tsx` - Core grid component
- `grid/entity-grid-host.tsx` - Client wrapper
- `grid/fetchers.ts` - Data fetching utilities
- `ag-grid-config.ts` - AG Grid module registration
- `renderers/` - Cell renderers and formatters

## Usage

Internal module - used by entity-specific configs (`projects/config.ts`, etc.) to build grid instances.

## Architecture

- Server-side row model (SSRM) for pagination
- Framework-agnostic column definitions
- Client-safe fetchers with credentials

## Client/Server Notes

- Grid components are client-only (AG Grid requires browser APIs)
- Fetchers are edge-safe (use fetch with credentials)
