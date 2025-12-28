# Projects Entity Grid

## Purpose

Entity grid configuration for projects table with columns, filters, and data fetching.

## Key Files

- `config.ts` - Projects grid configuration (columns, fetcher)

## Usage

```tsx
import { getEntityConfig } from '@/components/dashboard/entities';

const config = getEntityConfig('projects');
```

## Configuration

- Column definitions: `lib/entities/projects/columns.config.ts`
- API endpoint: `/api/v1/entity/projects`
- Server-side pagination and filtering

## Client/Server Notes

- Config is server-safe (no client dependencies)
- Grid rendering is client-only (AG Grid)
