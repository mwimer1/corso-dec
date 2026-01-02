// lib/marketing/insights/directus-adapter.ts
// Directus CMS adapter stub (Directus-ready seam for future integration)
import 'server-only';

import { getEnv } from '@/lib/server/env';
import type { InsightItem, InsightPreview } from '@/types/marketing';

/**
 * Directus CMS adapter (stub implementation - NOT YET IMPLEMENTED)
 * 
 * ⚠️ WARNING: This adapter is not yet implemented and will fall back to legacy adapter.
 * 
 * TODO: Implement Directus REST/GraphQL integration
 * - Fetch insights from Directus collections
 * - Map Directus item shape to InsightPreview/InsightItem
 * - Handle authentication via DIRECTUS_TOKEN
 * - Support filtering, sorting, pagination
 * 
 * Example Directus REST API:
 * GET ${DIRECTUS_URL}/items/insights?fields=*,categories.*
 * GET ${DIRECTUS_URL}/items/insights/${id}
 * GET ${DIRECTUS_URL}/items/categories
 * 
 * @throws {Error} Always throws - adapter not yet implemented. Source selector will fall back to legacy adapter.
 */
export async function getDirectusInsightsIndex(): Promise<InsightPreview[]> {
  const env = getEnv();
  const directusUrl = env.DIRECTUS_URL;
  const directusToken = env.DIRECTUS_TOKEN;

  if (!directusUrl || !directusToken) {
    throw new Error(
      'Directus adapter requires DIRECTUS_URL and DIRECTUS_TOKEN environment variables. ' +
      'Falling back to legacy adapter. To use Directus, implement the adapter first.'
    );
  }

  // TODO: Implement Directus REST API fetch
  // const response = await fetch(`${directusUrl}/items/insights?fields=*,categories.*`, {
  //   headers: {
  //     'Authorization': `Bearer ${directusToken}`,
  //   },
  // });
  // const data = await response.json();
  // return data.data.map(mapDirectusItemToPreview);

  throw new Error(
    'Directus adapter not yet implemented. ' +
    'Set CORSO_USE_MOCK_CMS=true or remove CORSO_CMS_PROVIDER=directus to use legacy adapter.'
  );
}

export async function getDirectusInsightBySlug(_slug: string): Promise<InsightItem | undefined> {
  const env = getEnv();
  const directusUrl = env.DIRECTUS_URL;
  const directusToken = env.DIRECTUS_TOKEN;

  if (!directusUrl || !directusToken) {
    throw new Error(
      'Directus adapter requires DIRECTUS_URL and DIRECTUS_TOKEN environment variables. ' +
      'Falling back to legacy adapter. To use Directus, implement the adapter first.'
    );
  }

  // TODO: Implement Directus REST API fetch by slug
  // const response = await fetch(`${directusUrl}/items/insights?filter[slug][_eq]=${slug}&fields=*,categories.*`, {
  //   headers: {
  //     'Authorization': `Bearer ${directusToken}`,
  //   },
  // });
  // const data = await response.json();
  // return data.data[0] ? mapDirectusItemToItem(data.data[0]) : undefined;

  throw new Error(
    'Directus adapter not yet implemented. ' +
    'Set CORSO_USE_MOCK_CMS=true or remove CORSO_CMS_PROVIDER=directus to use legacy adapter.'
  );
}

export async function getDirectusCategories(): Promise<Array<{ slug: string; name: string }>> {
  const env = getEnv();
  const directusUrl = env.DIRECTUS_URL;
  const directusToken = env.DIRECTUS_TOKEN;

  if (!directusUrl || !directusToken) {
    throw new Error(
      'Directus adapter requires DIRECTUS_URL and DIRECTUS_TOKEN environment variables. ' +
      'Falling back to legacy adapter. To use Directus, implement the adapter first.'
    );
  }

  // TODO: Implement Directus REST API fetch for categories
  // const response = await fetch(`${directusUrl}/items/categories?fields=slug,name`, {
  //   headers: {
  //     'Authorization': `Bearer ${directusToken}`,
  //   },
  // });
  // const data = await response.json();
  // return data.data.map((cat: any) => ({ slug: cat.slug, name: cat.name }));

  throw new Error(
    'Directus adapter not yet implemented. ' +
    'Set CORSO_USE_MOCK_CMS=true or remove CORSO_CMS_PROVIDER=directus to use legacy adapter.'
  );
}

