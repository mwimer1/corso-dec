// lib/server/subscription/tier-limits.ts
// Pricing tier definitions and Deep Research limits
import 'server-only';

import { auth } from '@clerk/nextjs/server';

/**
 * Pricing tier types based on subscription status.
 * Maps to Clerk subscriptionStatus values.
 */
export type PricingTier = 'free' | 'pro' | 'enterprise';

/**
 * Deep Research usage limits per pricing tier (per seat, per month).
 */
export const DEEP_RESEARCH_LIMITS: Record<PricingTier, number> = {
  free: 1,        // Lowest tier: 1 per month
  pro: 5,         // Middle tier: 5 per month
  enterprise: 10, // Highest tier: 10 per month
};

/**
 * Get user's pricing tier from Clerk metadata.
 * 
 * @param userId - Clerk user ID (optional, will fetch from auth if not provided)
 * @returns Pricing tier ('free', 'pro', 'enterprise')
 */
export async function getUserPricingTier(userId?: string): Promise<PricingTier> {
  try {
    // If userId provided, we'd need to fetch user from Clerk
    // For now, we'll use the current auth session
    const session = await auth();
    
    // Get subscription status from session claims metadata
    // Clerk stores this in publicMetadata.subscriptionStatus
    const sessionClaims = (session as any)?.sessionClaims;
    const subscriptionStatus = sessionClaims?.metadata?.subscriptionStatus as string | undefined;
    
    if (!subscriptionStatus) {
      return 'free'; // Default to free tier
    }
    
    // Normalize to lowercase for comparison
    const normalized = subscriptionStatus.toLowerCase();
    
    // Map subscription status to pricing tier
    if (normalized === 'pro') {
      return 'pro';
    }
    if (normalized === 'enterprise') {
      return 'enterprise';
    }
    
    // Default to free for any other value
    return 'free';
  } catch (error) {
    // On error, default to free tier (most restrictive)
    return 'free';
  }
}

/**
 * Get Deep Research limit for a given pricing tier.
 * 
 * @param tier - Pricing tier
 * @returns Monthly limit for Deep Research
 */
export function getDeepResearchLimit(tier: PricingTier): number {
  return DEEP_RESEARCH_LIMITS[tier];
}
