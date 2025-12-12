/**
 * @fileoverview Client-Safe Core Infrastructure Barrel Export
 * @module lib/core
 * @description Centralized exports for client-safe utilities
 *
 * This file automatically exports client-safe modules.
 * Server-only functionality should be imported directly from domain-specific modules.
 */

/**
 * Client-safe exports: All exports from './client' are safe for use in browser/client code.
 */
/* ── Client-Safe Exports ──────────────────────────────────────────────────── */
export * from './client';

// Note: Server-only exports are intentionally NOT re-exported from this client-safe barrel.
// Import server utilities directly from domain-specific modules to maintain runtime boundaries.

/* ── Developer Guidance ─────────────────────────────────────────────────── */
/**
 * USAGE GUIDELINES:
 *
 * ✅ CLIENT-SIDE: Import from '@/lib/core' for client-safe functionality
 * ✅ SERVER-SIDE: Import directly from domain-specific modules
 * ✅ AUTH & SESSION: Import from '@/lib/auth' modules (requires Node.js crypto)
 * ✅ DIRECT IMPORTS: Use specific paths like '@/lib/monitoring' when needed
 *
 * Examples:
 * ```tsx
 * // ✅ Client component
 * import { ApplicationError, publicEnv } from '@/lib/core';
 *
 * // ✅ Server component or API route
 * import { auth } from '@/lib/auth/server';
 * import { stripe } from '@/lib/integrations/stripe';
 *
 * // ✅ Direct import when specific
 * import { logger } from '@/lib/monitoring';
 * ```
 */

// NOTE: Server-only exports are NOT re-exported from this client-safe barrel.
// Import server utilities directly from domain-specific modules to maintain runtime boundaries.


