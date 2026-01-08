import type { BaseRow } from '@/types/dashboard';
import type { EntityFetchParams, EntityFetchResult, FetchEntityDataFn } from './contracts';

// Import the function dynamically to avoid circular dependency
const fetchEntityData: FetchEntityDataFn = async (slug, id, params) => {
  const { fetchEntityData: fetchFn } = await import('./actions');
  return fetchFn(slug, id, params);
};

// loadGridConfig now lives in ./config to avoid a cycle with actions.ts

export function createEntityFetchData<T extends BaseRow = BaseRow>(
  slug: string,
  id?: string,
) {
  return async (params: EntityFetchParams & { signal?: AbortSignal }): Promise<EntityFetchResult<T>> => {
    if (params.signal?.aborted) {
      throw new Error('Aborted');
    }

    // Read env at call time via integrations env helper
    const { getEnv } = await import('@/lib/integrations/env');
    const env = getEnv(['CORSO_USE_MOCK_DB']);
    const isMock = env.CORSO_USE_MOCK_DB === 'true';
    if (isMock && (slug === 'projects' || slug === 'companies' || slug === 'addresses')) {
      const { queryEntityFromCsv } = await import('@/lib/mocks/entity-data.server');
      const result = await queryEntityFromCsv(slug as 'projects' | 'companies' | 'addresses', params as any);
      return result as unknown as EntityFetchResult<T>;
    }
    return fetchEntityData<T>(
      slug,
      id,
      params,
    );
  };
}




