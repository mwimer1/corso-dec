// lib/api/auth-helpers.ts
// Server-only auth and RBAC helpers for API routes

import 'server-only';

import { auth } from '@clerk/nextjs/server';
import { http } from './http';
import { getEnv } from '@/lib/server/env';
import { logger } from '@/lib/monitoring';

/**
 * Auth result from Clerk's auth() function.
 * Includes userId, has function for role checks, and optional orgId.
 */
export interface AuthResult {
  userId: string;
  has: (options: { role: string }) => boolean;
  orgId?: string | null;
}

/**
 * Require authentication and return auth context.
 * 
 * Returns a standardized 401 Unauthorized response if userId is missing.
 * 
 * @returns Auth result with userId and has function, or Response for error cases
 * 
 * @example
 * ```typescript
 * const authResult = await requireAuth();
 * if (authResult instanceof Response) {
 *   return authResult; // Error response
 * }
 * const { userId, has } = authResult;
 * ```
 */
export async function requireAuth(): Promise<AuthResult | Response> {
  const authResult = await auth();
  
  if (!authResult.userId) {
    return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
  }
  
  return {
    userId: authResult.userId,
    has: authResult.has,
    orgId: authResult.orgId ?? null,
  };
}

/**
 * Require a specific role for the authenticated user.
 * 
 * Throws a standardized 403 Forbidden response if the user lacks the required role.
 * 
 * @param role - Required role (e.g., 'member', 'admin', 'owner')
 * @param authResult - Optional auth result from requireAuth() (if not provided, calls requireAuth())
 * @returns Auth result with userId and has function
 * @throws {Response} HTTP 403 error response if role check fails
 * 
 * @example
 * ```typescript
 * const { userId } = await requireRole('member');
 * // User is authenticated and has 'member' role
 * ```
 */
export async function requireRole(
  role: string,
  authResult?: AuthResult | Response
): Promise<AuthResult | Response> {
  const authContext = authResult ?? await requireAuth();
  
  if (authContext instanceof Response) {
    return authContext; // Already an error response
  }
  
  if (!authContext.has({ role })) {
    return http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' });
  }
  
  return authContext;
}

/**
 * Require any one of the provided roles for the authenticated user.
 * 
 * Returns a standardized 403 Forbidden response if the user lacks all required roles.
 * 
 * @param roles - Array of allowed roles (user must have at least one)
 * @param authResult - Optional auth result from requireAuth() (if not provided, calls requireAuth())
 * @returns Auth result with userId and has function, or Response for error cases
 * 
 * @example
 * ```typescript
 * const authResult = await requireAnyRole(['org:member', 'org:admin', 'org:owner']);
 * if (authResult instanceof Response) {
 *   return authResult; // Error response
 * }
 * const { userId } = authResult;
 * ```
 */
export async function requireAnyRole(
  roles: readonly string[],
  authResult?: AuthResult | Response
): Promise<AuthResult | Response> {
  const authContext = authResult ?? await requireAuth();
  
  if (authContext instanceof Response) {
    return authContext; // Already an error response
  }
  
  const hasAllowedRole = roles.some((role) => authContext.has({ role }));
  
  if (!hasAllowedRole) {
    return http.error(403, 'Insufficient permissions', { 
      code: 'FORBIDDEN',
      details: {
        requiredRoles: roles,
      },
    });
  }
  
  return authContext;
}

/**
 * Convenience wrapper that combines requireAuth() and requireRole().
 * 
 * @param requiredRole - Required role (e.g., 'member', 'admin', 'owner')
 * @returns Auth result with userId and has function, or Response for error cases
 * 
 * @example
 * ```typescript
 * const authResult = await requireAuthWithRBAC('member');
 * if (authResult instanceof Response) {
 *   return authResult; // Error response
 * }
 * const { userId } = authResult;
 * ```
 */
export async function requireAuthWithRBAC(requiredRole: string): Promise<AuthResult | Response> {
  return requireRole(requiredRole);
}

/**
 * Require any one of the provided roles for AI endpoints with feature flag support.
 * 
 * If ENFORCE_AI_RBAC is disabled, falls back to auth-only (no 403 for missing role).
 * If RBAC is enforced and user lacks roles, logs structured deny telemetry before returning 403.
 * 
 * @param roles - Array of allowed roles (user must have at least one)
 * @param routeName - Name of the route for logging (e.g., '/api/v1/ai/chat')
 * @param authResult - Optional auth result from requireAuth() (if not provided, calls requireAuth())
 * @returns Auth result with userId and has function, or Response for error cases
 * 
 * @example
 * ```typescript
 * const authResult = await requireAnyRoleForAI(['member', 'admin', 'owner'], '/api/v1/ai/chat');
 * if (authResult instanceof Response) {
 *   return authResult; // Error response
 * }
 * const { userId } = authResult;
 * ```
 */
export async function requireAnyRoleForAI(
  roles: readonly string[],
  routeName: string,
  authResult?: AuthResult | Response
): Promise<AuthResult | Response> {
  const authContext = authResult ?? await requireAuth();
  
  if (authContext instanceof Response) {
    return authContext; // Already an error response (401)
  }

  const env = getEnv();
  const enforceRBAC = env.ENFORCE_AI_RBAC !== false; // Default: true/enforced

  // If RBAC enforcement is disabled, allow any authenticated user
  if (!enforceRBAC) {
    return authContext;
  }

  const hasAllowedRole = roles.some((role) => authContext.has({ role }));
  
  if (!hasAllowedRole) {
    // Structured logging for RBAC deny telemetry
    logger.warn('AI RBAC deny', {
      route: routeName,
      userId: authContext.userId,
      orgId: authContext.orgId ?? null,
      requiredRoles: roles,
      code: 'FORBIDDEN',
    });

    return http.error(403, 'Insufficient permissions', { 
      code: 'FORBIDDEN',
      details: {
        requiredRoles: roles,
      },
    });
  }
  
  return authContext;
}
