// lib/server/db/tenant-context.ts
// Tenant context extraction for RLS enforcement
import 'server-only';

import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';

/**
 * Tenant context extracted from request/session
 */
export interface TenantContext {
  orgId: string;
  userId: string;
}

/**
 * Extract tenant context from request headers and Clerk session.
 * 
 * Priority:
 * 1. X-Corso-Org-Id header (required for API routes)
 * 2. Clerk session org_id from metadata (if available)
 * 
 * @param req - Next.js request (optional, for header extraction)
 * @returns Tenant context with orgId and userId
 * @throws ApplicationError if orgId cannot be determined
 */
export async function getTenantContext(req?: NextRequest): Promise<TenantContext> {
  // Extract userId from Clerk session
  const { userId } = await auth();
  if (!userId) {
    throw new ApplicationError({
      message: 'User not authenticated',
      code: 'UNAUTHENTICATED',
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
    });
  }

  // Try to get orgId from request header first (API routes)
  let orgId: string | null = null;
  if (req) {
    orgId = req.headers.get('x-corso-org-id') || req.headers.get('X-Corso-Org-Id');
  }

  // Fallback: try to get from Clerk session metadata (if available)
  if (!orgId) {
    try {
      const session = await auth();
      // Check if org_id is in session claims metadata
      const sessionClaims = (session as any)?.sessionClaims;
      if (sessionClaims?.metadata?.org_id) {
        orgId = sessionClaims.metadata.org_id;
      }
    } catch {
      // Session metadata not available, continue with header-only approach
    }
  }

  if (!orgId) {
    throw new ApplicationError({
      message: 'Organization ID required for tenant-scoped operations. Provide X-Corso-Org-Id header or ensure org_id in session metadata.',
      code: 'MISSING_ORG_CONTEXT',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.ERROR,
    });
  }

  return {
    orgId,
    userId,
  };
}

