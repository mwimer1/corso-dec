// lib/entities/org-resolution.ts
// Organization context resolution for entity routes - extracted from route handlers

import 'server-only';

import { auth, clerkClient } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';
import { http } from '@/lib/api';
import { isRelaxedAuthMode } from '@/lib/shared/config/auth-mode';

/**
 * Organization resolution result
 */
export interface OrgResolutionResult {
  orgId: string | null;
  source: 'header' | 'active' | 'fallback' | null;
}

const SHOULD_LOG =
  process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

/**
 * Resolve organization context from request headers and Clerk session.
 * 
 * Priority (strict mode):
 * 1. X-Corso-Org-Id header (explicit tenant selection)
 * 2. auth().orgId (active org in Clerk session)
 * 3. Fallback: first org from user's memberships
 * 
 * In relaxed mode, orgId can be null (will use userId as tenant fallback).
 * 
 * @param req - Next.js request
 * @param userId - Authenticated user ID (must be provided)
 * @returns Organization resolution result with orgId and source, or Response for error cases
 */
export async function resolveOrgContext(
  req: NextRequest,
  userId: string
): Promise<OrgResolutionResult | Response> {
  const isRelaxed = isRelaxedAuthMode();

  // Log auth mode for debugging (dev only)
  if (isRelaxed && SHOULD_LOG) {
    console.debug('[org resolution] Relaxed auth mode enabled - org checks bypassed');
  }

  // Resolve effective organization ID
  let orgId: string | null = null;
  let effectiveOrgIdSource: 'header' | 'active' | 'fallback' | null = null;

  if (!isRelaxed) {
    // Strict mode: resolve org ID in priority order
    if (req.headers) {
      orgId = req.headers.get('x-corso-org-id') || req.headers.get('X-Corso-Org-Id') || null;
      effectiveOrgIdSource = orgId ? 'header' : null;
    }

    const { orgId: activeOrgId } = await auth();

    if (!orgId) {
      orgId = activeOrgId ?? null;
      effectiveOrgIdSource = orgId ? 'active' : null;
    }

    if (!orgId) {
      if (SHOULD_LOG) {
        console.debug('[org resolution] No active organization found for userId:', userId, '- attempting to fetch user organizations');
      }

      try {
        // Get user's organization memberships and use the first one
        // Note: clerkClient may be a function in some Clerk versions, but types suggest it's an object
        const client = typeof clerkClient === 'function' ? await clerkClient() : clerkClient;
        const orgMemberships = await client.users.getOrganizationMembershipList({
          userId,
          limit: 1,
        });

        if (orgMemberships.data && orgMemberships.data.length > 0 && orgMemberships.data[0]) {
          orgId = orgMemberships.data[0].organization.id;
          effectiveOrgIdSource = 'fallback';
          if (SHOULD_LOG) {
            console.debug('[org resolution] Using first organization from memberships:', orgId);
          }
        }
      } catch (error) {
        if (SHOULD_LOG) {
          console.debug('[org resolution] Failed to fetch user organizations:', error);
        }
        // Continue to error handling below
      }
    }

    // Check for organization (required in strict mode)
    if (!orgId) {
      return http.error(403, 'No active organization. Please create or join an organization to continue.', {
        code: 'NO_ORG_CONTEXT',
        details: {
          message: 'You must be a member of an organization to access this resource. If you are a member, please ensure an organization is selected in your session.',
        },
      });
    }
  } else {
    // Relaxed mode: try to get orgId from header or active session, but don't require it
    if (req.headers) {
      orgId = req.headers.get('x-corso-org-id') || req.headers.get('X-Corso-Org-Id') || null;
      effectiveOrgIdSource = orgId ? 'header' : null;
    }

    const { orgId: activeOrgId } = await auth();

    if (!orgId) {
      orgId = activeOrgId ?? null;
      effectiveOrgIdSource = orgId ? 'active' : null;
    }
    // In relaxed mode, orgId can be null - we'll use userId as tenant fallback
  }

  return {
    orgId,
    source: effectiveOrgIdSource,
  };
}
