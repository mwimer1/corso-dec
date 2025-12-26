# Companies Entity Grid

## Purpose

Entity grid configuration for companies table with columns, filters, and data fetching.

## Key Files

- `config.ts` - Companies grid configuration (columns, fetcher)

## Usage

```tsx
import { getEntityConfig } from '@/components/dashboard/entities';

const config = getEntityConfig('companies');
```

## Configuration

- Column definitions: `lib/services/entities/companies/columns.config.ts`
- API endpoint: `/api/v1/entity/companies`
- Server-side pagination and filtering

## Client/Server Notes

- Config is server-safe (no client dependencies)
- Grid rendering is client-only (AG Grid)
