// lib/services/entity/pages.ts
// Shared entity data fetching service - source of truth for both internal and v1 APIs

import type { BaseRow } from '@/types/dashboard';
import { fetchEntityData } from './actions';
import type { EntityFetchParams, EntityFetchResult, EntityKind } from './contracts';

/**
 * Shared getEntityPage service - centralized data fetching for entity grids
 * Used by both internal API routes and v1 API routes for consistent data access
 */
export async function getEntityPage<T extends BaseRow = BaseRow>(
  entity: EntityKind,
  params: EntityFetchParams
): Promise<EntityFetchResult<T>> {
  return await fetchEntityData<T>(entity, undefined, params);
}

