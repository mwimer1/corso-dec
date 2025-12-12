// components/marketing/pricing/pricing-page.tsx
"use client";

import type { PricingCardProps } from "@/components/ui/molecules";
import { PricingCard } from "@/components/ui/molecules";
import { FullWidthSection } from "@/components/ui/organisms";
import { cn } from "@/styles";
import * as React from "react";
import { FaqSectionFrame } from "../../widgets/faq-section-frame";
import { PricingFAQ, type FAQItem } from "./pricing-faq";
import { PricingHeader } from "./pricing-header";
import type { ExtendedPricingPlan } from "./types";
// Local implementation to avoid cross-domain import
const persistSelectedPlan = (planSlug: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('selected-plan', planSlug);
    } catch {
      // Silently fail if localStorage is not available
    }
  }
};

interface PricingPageProps extends React.HTMLAttributes<HTMLDivElement> {
  plans: ExtendedPricingPlan[];
  faqs: readonly FAQItem[];
  headerTitle?: string;
  headerSubtitle?: string;
  /** Optional analytics hook when a plan is selected */
  onPlanSelect?: (_planSlug: string) => void;
}

/** PricingPage – Complete pricing page with toggle, tiers, and FAQ. */
export const PricingPage = React.forwardRef<HTMLDivElement, PricingPageProps>(
  ({ plans, faqs, headerTitle, headerSubtitle, onPlanSelect, className, ...props }, ref) => {
    // Local PLANS constant (derived from props) so we can map consistently
    const PLANS: ExtendedPricingPlan[] = plans;

    // Adapter: map ExtendedPricingPlan -> PricingCardProps (pricing shown as monthly)
    function toPricingCardProps(plan: ExtendedPricingPlan): PricingCardProps {
      const slug = (plan as any).slug ?? plan.title ?? "plan";
      const priceText = plan.priceText;

      // Small note shown directly under the price (subtle, italic)
      const priceNote = 'billed monthly';
      const description = plan.description ?? undefined;

      const p = {
        slug,
        title: plan.title,
        priceText,
        priceNote,
        description: description ?? '',
        features: plan.features ?? [],
        ctaText: 'Select',
      };

      const props: PricingCardProps = {
        plan: p,
        isPopular: !!(plan as any).popular,
        onSelect: (selectedSlug: string) => {
          try { persistSelectedPlan(String(selectedSlug)); } catch {}
          if (onPlanSelect) onPlanSelect(selectedSlug);
        },
        buttonVariant: 'default',
        buttonSize: 'default',
        variant: 'default',
      };

      return props;
    }

    return (
      <div ref={ref} id="pricing" className={cn(className)} {...props}>
        {/* Header Section */}
        <FullWidthSection
          padding="sm"
          containerMaxWidth="7xl"
          containerPadding="lg"
          showVerticalGuidelines
          guidesVisibility="always"
          opacity="none"
          guidelineColor="bg-border"
        >
          <PricingHeader
            {...(headerTitle ? { title: headerTitle } : {})}
            {...(headerSubtitle ? { subtitle: headerSubtitle } : {})}
          />
        </FullWidthSection>

        {/* Pricing Tiers Section (mapped from PLANS) */}
        <FullWidthSection
          containerMaxWidth="7xl"
          containerPadding="lg"
          showVerticalGuidelines
          guidesVisibility="always"
          opacity="none"
          guidelineColor="bg-border"
        >
          <section id="tiers">
            <div className="mt-0">
              <div className="flex flex-wrap items-stretch justify-center gap-6">
                {PLANS.map((plan, idx) => {
                  const props = toPricingCardProps(plan);
                  // Middle card (index 1) keeps dark button; left/right use the standard white-outline (secondary)
                  props.buttonVariant = idx === 1 ? 'default' : 'secondary';
                  return <PricingCard key={props.plan.slug} {...props} />;
                })}
              </div>
            </div>
          </section>
        </FullWidthSection>

        {/* FAQ Section */}
        <FullWidthSection
          containerMaxWidth="7xl"
          containerPadding="lg"
          showVerticalGuidelines
          guidesVisibility="always"
          opacity="none"
          guidelineColor="bg-border"
        >
          <FaqSectionFrame>
            <PricingFAQ faqs={faqs} />
          </FaqSectionFrame>
        </FullWidthSection>

        {/* Minimal JSON-LD Product/Offer for plans */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: headerTitle ?? 'Corso Plans',
              offers: plans.map((p) => ({
                '@type': 'Offer',
                name: p.title,
                price: (p.priceText.match(/\$(\d+(?:\.\d+)?)/)?.[1]) ?? undefined,
                priceCurrency: 'USD',
                url: '#tiers',
                availability: 'https://schema.org/InStock',
              })),
            }),
          }}
        />
      </div>
    );
  },
);
PricingPage.displayName = "PricingPage";
