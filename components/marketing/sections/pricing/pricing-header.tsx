// PricingHeader – Header for the Pricing page, matches landing hero typography.
"use client";

import { cn } from "@/styles";
import { headingVariants } from "@/styles/ui/shared/typography-variants";
import * as React from "react";

interface PricingHeaderProps {
  title?: string;
  subtitle?: string;
  /** Optional toggle (monthly / annual) */
  toggle?: React.ReactNode;
  className?: string;
}

export const PricingHeader = React.forwardRef<
  HTMLDivElement,
  PricingHeaderProps
>(
  (
    {
      title = "Simple, transparent pricing",
      subtitle = "Choose the plan that's right for your business and scale as you grow.",
      toggle,
      className,
    },
    ref,
  ) => (
    <div ref={ref} className={cn(className)}>
      {/* Reuse shared SectionHeader for consistent heading styles */}
      <section>
        {/* center alignment preserved */}
        <div className="text-center">
          <h1 className={headingVariants({ size: 'h1' }) + " text-foreground"}>{title}</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
          {toggle && <div className="mt-xl flex justify-center">{toggle}</div>}
        </div>
      </section>
    </div>
  ),
);
PricingHeader.displayName = "PricingHeader";
