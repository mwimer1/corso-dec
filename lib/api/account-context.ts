// lib/api/account-context.ts
// Unified account context resolution supporting both org-scoped (enterprise) and personal-scope (org-less) access
import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { isRelaxedAuthMode } from '@/lib/shared';

/**
 * Account context with optional organization
 */
export interface AccountContext {
  userId: string;
  orgId: string | null;
  orgSource: 'header' | 'clerk_active' | 'clerk_membership' | null;
}

/**
 * Options for account context resolution
 */
export interface AccountContextOptions {
  /**
   * Whether org is required. If false, returns { orgId: null } instead of throwing when no org found.
   * Default: false (supports personal-scope by default)
   */
  requireOrg?: boolean;
}

const SHOULD_LOG =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

/**
 * Resolve account context (userId + optional orgId) from request headers and Clerk session.
 * 
 * This is the unified helper for all API routes that need to support both:
 * - Personal-scope: authenticated users without org (orgId: null)
 * - Enterprise-scope: authenticated users with org (orgId: string)
 * 
 * Priority for org resolution (when requireOrg: false):
 * 1. X-Corso-Org-Id header (explicit tenant selection)
 * 2. auth().orgId (active org in Clerk session)
 * 3. Fallback: first org from user's memberships
 * 4. If none found: orgId = null (personal-scope)
 * 
 * @param req - Next.js request (optional, for header extraction)
 * @param options - Resolution options (requireOrg: whether org is required, default false)
 * @returns Account context with userId and optional orgId
 * @throws ApplicationError if userId cannot be determined or if requireOrg: true and no org found
 */
export async function getAccountContext(
  req?: NextRequest,
  options?: AccountContextOptions
): Promise<AccountContext> {
  const requireOrg = options?.requireOrg ?? false;
  const isRelaxed = isRelaxedAuthMode();

  // Extract userId from Clerk session (always required)
  const { userId, orgId: activeOrgId } = await auth();
  if (!userId) {
    throw new ApplicationError({
      message: 'User not authenticated',
      code: 'UNAUTHENTICATED',
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
    });
  }

  // Resolve organization ID (optional for personal-scope)
  let orgId: string | null = null;
  let orgSource: 'header' | 'clerk_active' | 'clerk_membership' | null = null;

  // Try to get orgId from request header first (API routes)
  if (req?.headers) {
    orgId = req.headers.get('x-corso-org-id') || req.headers.get('X-Corso-Org-Id') || null;
    if (orgId) {
      orgSource = 'header';
    }
  }

  // Fallback: try active org from Clerk session
  if (!orgId && activeOrgId) {
    orgId = activeOrgId;
    orgSource = 'clerk_active';
  }

  // Fallback: try first org from user's memberships (only if not in relaxed mode)
  if (!orgId && !isRelaxed) {
    try {
      const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
      const orgMemberships = await client.users.getOrganizationMembershipList({
        userId,
        limit: 1,
      });

      if (orgMemberships.data && orgMemberships.data.length > 0 && orgMemberships.data[0]) {
        orgId = orgMemberships.data[0].organization.id;
        orgSource = 'clerk_membership';
        if (SHOULD_LOG) {
          console.debug('[account context] Using first organization from memberships:', orgId);
        }
      }
    } catch (error) {
      if (SHOULD_LOG) {
        console.debug('[account context] Failed to fetch user organizations:', error);
      }
      // Continue - orgId remains null (personal-scope)
    }
  }

  // If org is required but not found, throw error
  if (requireOrg && !orgId) {
    throw new ApplicationError({
      message: 'Organization ID required for this operation. Provide X-Corso-Org-Id header or ensure org_id in session metadata.',
      code: 'MISSING_ORG_CONTEXT',
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.ERROR,
    });
  }

  // Log for debugging (dev only)
  if (SHOULD_LOG && !orgId && !isRelaxed) {
    console.debug('[account context] No organization found for userId:', userId, '- proceeding with personal-scope');
  }

  return {
    userId,
    orgId,
    orgSource,
  };
}
