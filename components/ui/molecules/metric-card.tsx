"use client";

import { cn } from "@/styles";
import type { MetricCardVariantProps } from "@/styles/ui/molecules";
import { metricCardVariants, metricCardValueSizeVariants } from "@/styles/ui/molecules";
import * as React from "react";

export function MetricCard({
  title,
  value,
  helper,
  tone,
  size,
  density,
  valueSize,
  ariaLabel,
  className,
}: React.PropsWithChildren<
  MetricCardVariantProps & {
    title: string;
    value: React.ReactNode;
    helper?: React.ReactNode;
    className?: string;
    ariaLabel?: string;
  }
>) {
  return (
    <section className={cn(metricCardVariants({ tone, size, density }), className)} aria-label={ariaLabel}>
      <h3 className="text-sm md:text-base font-semibold tracking-tight text-foreground text-center">
        {title}
      </h3>
      <div
        className={metricCardValueSizeVariants({ valueSize })}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </div>
      {helper ? (
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed text-center">
          {helper}
        </p>
      ) : null}
    </section>
  );
}


