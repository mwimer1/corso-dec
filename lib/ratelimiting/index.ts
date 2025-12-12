/**
 * @fileoverview Consolidated rate limiting domain
 * @module lib/rate-limiting
 */

// Core functionality
export * from './core';
export * from './types';

// Adapters
export { createMemoryStore } from './adapters/memory';
export { createRedisStore } from './adapters/redis';

// Algorithms
export { fixedWindowRateLimit } from './algorithms/fixed-window';

// Stores
export { getDefaultStore, resetDefaultStore } from './store';

// Domain configurations
export { ACTION_RATE_LIMITS } from './domains/actions';


// Ensure key util is exported to avoid orphan warning
export * from './key';

/**
 * Note: This module contains core rate limiting algorithms, stores, and configuration.
 * Do NOT export middleware wrappers from here - they belong in @/lib/middleware/edge.
 *
 * Import middleware wrappers like withRateLimitEdge from @/lib/middleware/edge/rate-limit
 * or from the convenience barrel @/lib/api (which re-exports them).
 */


export * from './server';

