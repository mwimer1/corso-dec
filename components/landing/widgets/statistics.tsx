"use client";

// Statistics for Market Insights section and other landing KPIs
import React from "react";
import { AnimatedNumber } from "./animated-number";

type Props = {
  totalProjects: number;
  totalJobValue: number;
  averageJobValue: number;
  /** Optional class applied to numeric values (e.g., 'text-primary') */
  valueClassName?: string;
  /** Use tighter spacing (reduces bottom margin/padding and gaps) */
  compact?: boolean;
  /** Optional class on wrapper */
  className?: string;
};

const StatBlock: React.FC<{ label: string; value: number; mode?: "currency" | "number"; rightBorder?: boolean; valueClassName?: string | undefined; }> = ({ label, value, mode = "number", rightBorder, valueClassName }) => (
  <div className={`min-w-0 ${rightBorder ? "md:border-r border-border pr-4" : ""}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`mt-1 text-3xl font-semibold leading-none truncate tabular-nums ${valueClassName ?? "text-foreground"}`}>
      <AnimatedNumber value={value} mode={mode} durationMs={1000} />
    </p>
  </div>
);

export const Statistics: React.FC<Props> = ({ totalProjects, totalJobValue, averageJobValue, valueClassName, compact, className }) => (
  <div className={`grid grid-cols-3 ${compact ? "gap-6" : "gap-8"} ${className ?? ""}`.trim()}>
    <StatBlock label="Job Value" value={totalJobValue} mode="currency" valueClassName={valueClassName} />
    <StatBlock label="Project Count" value={totalProjects} valueClassName={valueClassName} />
    <StatBlock label="Avg. Job Value" value={averageJobValue} mode="currency" valueClassName={valueClassName} />
  </div>
);


