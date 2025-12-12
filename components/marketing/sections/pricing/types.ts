import type { PricingPlan } from "@/components/ui/molecules";

/**
 * Extended pricing plan interface for marketing sections.
 * Extends the base PricingPlan with marketing-specific fields.
 */
export interface ExtendedPricingPlan extends PricingPlan {
  /** Optional precomputed annual price string like "$288/yr" */
  annualPriceText?: string;
}

