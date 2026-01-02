// lib/api/tenant-context-helpers.ts
// Helper to convert tenant context errors to HTTP responses (edge-safe)

import { http } from './http';

/**
 * Convert ApplicationError from getTenantContext to HTTP response.
 * 
 * This helper eliminates duplication of error mapping logic across routes.
 * It's edge-safe and can be used in route handlers.
 * 
 * Error mapping:
 * - UNAUTHENTICATED → 401 Unauthorized (code: 'HTTP_401')
 * - MISSING_ORG_CONTEXT → 400 Bad Request (code: 'MISSING_ORG_CONTEXT')
 * - Unknown errors → 400 Bad Request (code: 'MISSING_ORG_CONTEXT')
 * 
 * @param error - Error caught from getTenantContext()
 * @returns HTTP Response with appropriate status code and error payload
 * 
 * @example
 * ```typescript
 * try {
 *   const tenantContext = await getTenantContext(req);
 *   const { orgId } = tenantContext;
 * } catch (error) {
 *   return mapTenantContextError(error);
 * }
 * ```
 */
export function mapTenantContextError(error: unknown): Response {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = error.code as string;
    
    if (code === 'UNAUTHENTICATED') {
      return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
    }
    
    if (code === 'MISSING_ORG_CONTEXT') {
      return http.error(400, 'Organization ID required. Provide X-Corso-Org-Id header or ensure org_id in session metadata.', { 
        code: 'MISSING_ORG_CONTEXT' 
      });
    }
  }
  
  // Fallback for unknown errors
  return http.error(400, 'Failed to determine organization context', { 
    code: 'MISSING_ORG_CONTEXT' 
  });
}
