/**
 * @fileoverview Authentication Domain Barrel Export
 * @description Authentication, role-based access control, and billing access control with Clerk v6.
 * @runtime Server-only (Node.js runtime required)
 */

/**
 * Clerk appearance configuration
 */
export * from './clerk-appearance';

/**
 * Clerk client utilities (client-safe)
 */
export * from './client';

/**
 * Authorization utilities (legacy RBAC + new Clerk v6 helpers)
 */
export * from './authorization/roles';

// Server-only utilities should not be re-exported from the client-safe barrel
// import './server' (removed)

