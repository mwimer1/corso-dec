import 'server-only';

/**
 * Server-only marketing exports.
 * Exports that rely on server-only APIs (fs, process, 'server-only', etc.)
 */

export { categorySlugify, getAllInsights, getCategories, getInsightBySlug, getInsightsByCategory, getRelatedInsights } from './insights/content-service';
export type { GetByCategoryParams } from './insights/content-service';
// Keep static-data server-only to avoid shipping large payloads to the client by accident.
export * from './insights/static-data';



