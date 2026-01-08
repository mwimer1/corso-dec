// PricingHeader – Header for the Pricing page, matches landing hero typography.
"use client";

import { cn } from "@/styles";
import * as React from "react";
import { useEffect, useState } from "react";
import styles from "./pricing-header.module.css";
import { underlineAccent } from "@/styles/ui/shared";

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
  ) => {
    const [underlineVisible, setUnderlineVisible] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setUnderlineVisible(true), 200);
      return () => clearTimeout(t);
    }, []);

    const underline = underlineAccent({ show: underlineVisible, color: 'primary', duration: 'slow' });

    return (
      <div ref={ref} className={cn(className)}>
        {/* Matches landing hero typography styles */}
        <section>
          <div className="text-center">
            <h1 className={styles['title']}>
              {title.split(' ').slice(0, -1).join(' ')}
              {title.split(' ').length > 1 && ' '}
              <span className={underline.wrap()}>
                {title.split(' ').slice(-1)[0]}
                <span className={underline.line()} />
              </span>
            </h1>
            {subtitle && (
              <p className={cn(styles['subtitle'], "max-w-2xl mx-auto")}>{subtitle}</p>
            )}
            {toggle && <div className="mt-xl flex justify-center">{toggle}</div>}
          </div>
        </section>
      </div>
    );
  },
);
PricingHeader.displayName = "PricingHeader";
