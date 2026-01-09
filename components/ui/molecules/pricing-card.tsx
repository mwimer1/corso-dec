// components/ui/molecules/pricing-card.tsx\n// app/_components/ui/molecules/pricing-card.tsx
"use client";

import { Button } from "@/components/ui/atoms";
import { cn } from "@/styles";
import type { ButtonVariantProps } from "@/styles/ui/atoms";
import type { PricingCardVariantProps } from "@/styles/ui/molecules";
import {
    pricingCardVariants,
} from "@/styles/ui/molecules";
import * as React from "react";

export interface PricingPlan {
  slug: string;
  title: string;
  priceText: string;
  description?: string;
  /** Small note displayed near the price (e.g., "billed monthly") */
  priceNote?: string;
  features: string[];
  ctaText?: string;
}

export interface PricingCardProps {
  plan: PricingPlan;
  /** Highlight this plan as "Most Popular". */
  isPopular?: boolean;
  /** Callback when CTA is clicked (passes plan slug). */
  onSelect?: (_planSlug: string) => void; // v2025-06-10-audit
  /** Custom button variant (design system key) */
  buttonVariant?: ButtonVariantProps["variant"];
  /** Custom button size (design system key) */
  buttonSize?: ButtonVariantProps["size"];
  /** Visual style variant for the card (default/featured/minimal) */
  variant?: PricingCardVariantProps["variant"];
  /** Additional CSS classes */
  className?: string;
}

export const PricingCard = React.forwardRef<HTMLDivElement, PricingCardProps>(
  function PricingCard(
    {
      plan,
      isPopular = false,
      onSelect,
      buttonVariant = "default",
      buttonSize = "default",
      variant = "default",
      className,
    },
    ref,
  ) {
    const {
      slug,
      title,
      priceText,
      description,
      features,
      ctaText = "Get Started",
    } = plan;

    // Get variant styles
    const styles = pricingCardVariants({ variant, isPopular, size: "md" });

    return (
      <div ref={ref} className={cn(styles.container(), className)}>
        {/* Header with title and badge */}
        <div className={styles.header()}>
          <h3 className={styles.title()}>{title}</h3>
          {isPopular && (
            <span className={styles.popularBadge()}>Most&nbsp;Popular</span>
          )}
        </div>
        <p className={styles.price()}>{priceText}</p>
        {plan.priceNote && <p className={styles.priceNote()}>{plan.priceNote}</p>}
        {description && <p className={styles.description()}>{description}</p>}
        {/* Feature list */}
        <ul className={styles.featureList()}>
          {features.map((feat) => (
            <li key={feat} className={styles.featureItem()}>
              {feat}
            </li>
          ))}
        </ul>
        {/* Call-to-Action button */}
        <Button
          variant={buttonVariant}
          size={buttonSize}
          fullWidth={true}
          onClick={() => onSelect?.(slug)}
          className={
            buttonVariant === 'whiteSolid'
              ? `${styles.ctaButton()} bg-surface border-2 border-border`
              : styles.ctaButton()
          }
        >
          {ctaText}
        </Button>
      </div>
    );
  },
);
PricingCard.displayName = "PricingCard";
