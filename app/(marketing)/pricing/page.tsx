// FILE: app/(marketing)/pricing/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
// Client component to handle plan selection redirects
"use client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { formatPriceUSD, PRICING_UI, PublicLayout } from "@/components";
import { landingNavItems } from "@/components/landing/layout/nav.config";
import { PricingPage } from "@/components/marketing";
import { useRouter } from "next/navigation";
import ScrollToFAQ from "./scroll-to-faq";

// FAQ data
const faqItems = [
  {
    question: "What's included in the free trial?",
    answer: "Full access to all features for 7 days. No credit card required.",
  },
  {
    question: "Can I change plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans.",
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes, we offer a 30-day money-back guarantee on all plans.",
  },
  {
    question: "Is there a setup fee?",
    answer: "No setup fees. You only pay for the plan you choose.",
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription at any time. No long-term contracts.",
  },
] as const;

export default function PublicPricingPage() {
  const router = useRouter();

  // Transform PRICING_UI data into PricingPlan format (monthly pricing only)
  const pricingPlans = Object.entries(PRICING_UI).map(([key, plan]) => ({
    slug: key,
    title: plan.label,
    priceText: formatPriceUSD(plan.monthlyUsd) + '/mo',
    priceNote: 'billed monthly',
    description: plan.tagline,
    features: plan.features,
    ctaText: "Start free",
    popular: plan.popular,
  }));

  const handlePlanSelect = (planSlug: string) => {
    // Persist selected plan (already handled by PricingPage component)
    // Redirect to sign-in route with plan parameter for post-auth redirect to pricing
    router.push(`/sign-in?plan=${planSlug}&redirect=/pricing`);
  };

  return (
    <PublicLayout navMode="landing" navItems={landingNavItems}>
      <ScrollToFAQ />
      <PricingPage
        plans={pricingPlans}
        faqs={faqItems}
        headerTitle="Choose Your Plan"
        headerSubtitle="Start with a 7-day free trial — no credit card required."
        onPlanSelect={handlePlanSelect}
      />
    </PublicLayout>
  );
}
