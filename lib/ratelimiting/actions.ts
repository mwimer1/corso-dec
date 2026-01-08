/**
 * @fileoverview Rate limiting configurations for actions domain
 * @module lib/rate-limiting/actions
 */

import type { DomainRateLimits } from './types';

/**
 * Rate limiting configurations for different action types
 */
export const ACTION_RATE_LIMITS: DomainRateLimits = {
  // Standard user actions
  USER_ACTION: { windowMs: 60000, maxRequests: 30 },
  // Write operations (saves, updates)
  WRITE_OPERATION: { windowMs: 60000, maxRequests: 15 },
  // AI generation operations
  AI_GENERATION: { windowMs: 60000, maxRequests: 15 },
  // Analytics queries
  ANALYTICS_QUERY: { windowMs: 60000, maxRequests: 100 },
  // Subscription operations
  SUBSCRIPTION_READ: { windowMs: 60000, maxRequests: 30 },
  SUBSCRIPTION_WRITE: { windowMs: 60000, maxRequests: 10 },
};
