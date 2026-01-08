// lib/api/ai/chat/usage-limits.ts
// Deep Research usage limit checking and tracking
import 'server-only';

import type { NextRequest } from 'next/server';
import { getTenantContext, getUserPricingTier, getDeepResearchLimit, withTenantClient } from '@/lib/server';
import { http } from '@/lib/api';
import { logger } from '@/lib/monitoring';

/**
 * Result of usage limit check.
 */
export interface UsageLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  currentUsage: number;
}

/**
 * Check if user can perform Deep Research based on pricing tier limits.
 * 
 * @param req - Next.js request (for tenant context)
 * @returns Usage limit result with allowed status and remaining count
 */
export async function checkDeepResearchLimit(req: NextRequest): Promise<UsageLimitResult | Response> {
  try {
    // Get tenant context (userId, orgId)
    const tenantContext = await getTenantContext(req);
    const { userId, orgId } = tenantContext;
    
    // Get user's pricing tier
    const tier = await getUserPricingTier(userId);
    const limit = getDeepResearchLimit(tier);
    
    // Get current month usage from Supabase
    const currentUsage = await withTenantClient(req, async (client) => {
      // Call RPC function to get current month usage
      // Cast to any since RPC function may not be in generated types yet
      const rpcCall = client.rpc as any;
      const { data, error } = await rpcCall('get_deep_research_usage', {
        p_user_id: userId,
      } as any);
      
      if (error) {
        logger.error('[UsageLimits] Failed to get usage count', {
          error: error.message,
          userId,
          orgId,
        });
        // On error, default to 0 (allow request, but log error)
        return 0;
      }
      
      return data ?? 0;
    });
    
    const remaining = Math.max(0, limit - currentUsage);
    const allowed = currentUsage < limit;
    
    return {
      allowed,
      remaining,
      limit,
      currentUsage,
    };
  } catch (error) {
    logger.error('[UsageLimits] Error checking Deep Research limit', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // On error, return error response
    return http.error(500, 'Failed to check usage limits', {
      code: 'USAGE_LIMIT_CHECK_ERROR',
    });
  }
}

/**
 * Increment Deep Research usage count for current month.
 * 
 * @param req - Next.js request (for tenant context)
 * @returns New usage count after increment
 */
export async function incrementDeepResearchUsage(req: NextRequest): Promise<number | Response> {
  try {
    // Get tenant context (userId, orgId)
    const tenantContext = await getTenantContext(req);
    const { userId, orgId } = tenantContext;
    
    // Increment usage count via RPC function
    const newCount = await withTenantClient(req, async (client) => {
      // Cast to any since RPC function may not be in generated types yet
      const rpcCall = client.rpc as any;
      const { data, error } = await rpcCall('increment_deep_research_usage', {
        p_user_id: userId,
        p_org_id: orgId,
      } as any);
      
      if (error) {
        logger.error('[UsageLimits] Failed to increment usage', {
          error: error.message,
          userId,
          orgId,
        });
        throw error;
      }
      
      return data ?? 0;
    });
    
    logger.info('[UsageLimits] Deep Research usage incremented', {
      userId,
      orgId,
      newCount,
    });
    
    return newCount;
  } catch (error) {
    logger.error('[UsageLimits] Error incrementing Deep Research usage', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // On error, return error response
    return http.error(500, 'Failed to track usage', {
      code: 'USAGE_TRACKING_ERROR',
    });
  }
}
