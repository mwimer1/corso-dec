"use client";

import { tv, type VariantProps } from "@/styles/utils";
import * as React from "react";

const metricCard = tv({
  base: [
    "rounded-2xl border bg-[hsl(var(--card))] shadow-sm",
    "flex flex-col items-center justify-center",
  ],
  variants: {
    tone: {
      neutral: "border-[hsl(var(--border))] bg-[hsl(var(--muted))]/30",
      brand: "border-[hsl(var(--ring))] bg-[hsl(var(--surface-selected))]/15",
      success: "border-[hsl(var(--success))] bg-[hsl(var(--success))/8%]",
    },
    size: { md: "min-h-[168px]", lg: "min-h-[200px]" },
    density: {
      normal: "p-5 md:p-6 gap-2",
      compact: "p-4 md:p-4 gap-1.5",
    },
    valueSize: {
      md: "text-3xl md:text-4xl",
      sm: "text-2xl md:text-3xl",
    },
  },
  defaultVariants: { tone: "neutral", size: "md", density: "normal", valueSize: "md" },
});

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
  VariantProps<typeof metricCard> & {
    title: string;
    value: React.ReactNode;
    helper?: React.ReactNode;
    className?: string;
    ariaLabel?: string;
  }
>) {
  return (
    <section className={metricCard({ tone, size, density, className })} aria-label={ariaLabel}>
      <h3 className="text-sm md:text-base font-semibold tracking-tight text-[hsl(var(--foreground))] text-center">
        {title}
      </h3>
      <div
        className={tv({ base: 'font-extrabold leading-none text-center', variants: { valueSize: {
          md: 'text-3xl md:text-4xl',
          sm: 'text-2xl md:text-3xl',
        }}})({ valueSize })}
        aria-live="polite"
        aria-atomic="true"
      >
        {value}
      </div>
      {helper ? (
        <p className="text-xs md:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed text-center">
          {helper}
        </p>
      ) : null}
    </section>
  );
}


