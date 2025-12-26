# Addresses Entity Grid

## Purpose

Entity grid configuration for addresses table with columns, filters, and data fetching.

## Key Files

- `config.ts` - Addresses grid configuration (columns, fetcher)

## Usage

```tsx
import { getEntityConfig } from '@/components/dashboard/entities';

const config = getEntityConfig('addresses');
```

## Configuration

- Column definitions: `lib/services/entities/addresses/columns.config.ts`
- API endpoint: `/api/v1/entity/addresses`
- Server-side pagination and filtering

## Client/Server Notes

- Config is server-safe (no client dependencies)
- Grid rendering is client-only (AG Grid)
