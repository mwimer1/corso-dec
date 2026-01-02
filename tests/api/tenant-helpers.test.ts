/**
 * Unit tests for tenant context error mapping helpers
 * 
 * Tests mapTenantContextError to ensure it correctly maps ApplicationError
 * instances to HTTP responses with proper status codes and error payloads.
 */

import { describe, expect, it } from 'vitest';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { mapTenantContextError } from '@/lib/api/tenant-context-helpers';

describe('mapTenantContextError', () => {
  describe('Error mapping', () => {
    it('should map UNAUTHENTICATED to 401 with HTTP_401 code', async () => {
      const error = new ApplicationError({
        message: 'User not authenticated',
        code: 'UNAUTHENTICATED',
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.ERROR,
      });

      const result = mapTenantContextError(error);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(401);
        const body = await result.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('HTTP_401');
        expect(body.error.message).toBe('Unauthorized');
      }
    });

    it('should map MISSING_ORG_CONTEXT to 400 with MISSING_ORG_CONTEXT code', async () => {
      const error = new ApplicationError({
        message: 'Organization ID required for tenant-scoped operations. Provide X-Corso-Org-Id header or ensure org_id in session metadata.',
        code: 'MISSING_ORG_CONTEXT',
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.ERROR,
      });

      const result = mapTenantContextError(error);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
        const body = await result.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('MISSING_ORG_CONTEXT');
        expect(body.error.message).toBe('Organization ID required. Provide X-Corso-Org-Id header or ensure org_id in session metadata.');
      }
    });

    it('should map unknown errors to 400 with MISSING_ORG_CONTEXT code', async () => {
      const error = new Error('Unknown error');

      const result = mapTenantContextError(error);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
        const body = await result.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('MISSING_ORG_CONTEXT');
        expect(body.error.message).toBe('Failed to determine organization context');
      }
    });

    it('should map ApplicationError without code to 400 with MISSING_ORG_CONTEXT code', async () => {
      // Create an ApplicationError-like object without code
      const error = { message: 'Some error' };

      const result = mapTenantContextError(error);

      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
        const body = await result.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('MISSING_ORG_CONTEXT');
        expect(body.error.message).toBe('Failed to determine organization context');
      }
    });
  });

  describe('Behavior equivalence with original routes', () => {
    it('should match query route error mapping for UNAUTHENTICATED', async () => {
      const error = new ApplicationError({
        message: 'User not authenticated',
        code: 'UNAUTHENTICATED',
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.ERROR,
      });

      const result = mapTenantContextError(error);

      // Original route: http.error(401, 'Unauthorized', { code: 'HTTP_401' })
      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(401);
        const body = await result.json();
        expect(body.error.code).toBe('HTTP_401');
        expect(body.error.message).toBe('Unauthorized');
      }
    });

    it('should match generate-sql route error mapping for MISSING_ORG_CONTEXT', async () => {
      const error = new ApplicationError({
        message: 'Organization ID required for tenant-scoped operations. Provide X-Corso-Org-Id header or ensure org_id in session metadata.',
        code: 'MISSING_ORG_CONTEXT',
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.ERROR,
      });

      const result = mapTenantContextError(error);

      // Original route: http.error(400, 'Organization ID required...', { code: 'MISSING_ORG_CONTEXT' })
      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
        const body = await result.json();
        expect(body.error.code).toBe('MISSING_ORG_CONTEXT');
        expect(body.error.message).toBe('Organization ID required. Provide X-Corso-Org-Id header or ensure org_id in session metadata.');
      }
    });

    it('should match chat route error mapping for fallback errors', async () => {
      const error = new Error('Unexpected error');

      const result = mapTenantContextError(error);

      // Original route: http.error(400, 'Failed to determine organization context', { code: 'MISSING_ORG_CONTEXT' })
      expect(result).toBeInstanceOf(Response);
      if (result instanceof Response) {
        expect(result.status).toBe(400);
        const body = await result.json();
        expect(body.error.code).toBe('MISSING_ORG_CONTEXT');
        expect(body.error.message).toBe('Failed to determine organization context');
      }
    });
  });
});
