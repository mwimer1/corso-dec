"use client";

// components/insights/layout/insights-section.tsx
import { SectionShell } from "@/components/ui/patterns";
import { ReadingProgress } from "@/components/ui/molecules";
import * as React from "react";

type InsightsSectionTone = "surface" | "muted" | "brand" | "dark";

interface InsightsSectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Background tone for the section */
  tone?: InsightsSectionTone;
  /** Enable vertical guidelines for development */
  guidelines?: React.ReactNode;
  /** Show reading progress indicator (for article pages) */
  showReadingProgress?: boolean;
  /** Custom reading progress component */
  readingProgress?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export function InsightsSection({
  tone = "surface",
  guidelines,
  showReadingProgress = false,
  readingProgress,
  className,
  children,
  ...rest
}: InsightsSectionProps): JSX.Element {
  return (
    <SectionShell
      tone={tone}
      {...(guidelines ? { guidelines } : {})}
      className={className}
      {...rest}
    >
      {showReadingProgress && (readingProgress || <ReadingProgress />)}
      {children}
    </SectionShell>
  );
}

export default InsightsSection;
