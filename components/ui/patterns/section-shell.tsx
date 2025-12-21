"use client";

import { cn } from "@/styles";
import * as React from "react";

interface SectionShellProps extends React.HTMLAttributes<HTMLElement> {
  /** Background tone for section */
  tone?: "surface" | "muted" | "brand" | "dark";
  /** Optional custom guidelines node (e.g., grid lines) rendered as an overlay */
  guidelines?: React.ReactNode;
  /**
   * Optional center guideline overlay for marketing parity.
   * When true, draws a subtle vertical line at 50% width.
   * You may pass an object to set opacity.
   */
  centerLine?: boolean | { opacity?: number };
  /** Additional className for inner container */
  containerClassName?: string;
}

/**
 * SectionShell – Shared layout shell for page sections.
 * Provides a full-width section with optional guidelines and centered content container.
 */
// eslint-disable-next-line import/no-unused-modules -- Used in components/insights/layout/insights-section.tsx and components/landing/layout/landing-section.tsx
export function SectionShell({
  tone = "surface",
  guidelines,
  centerLine,
  className,
  containerClassName,
  children,
  ...rest
}: SectionShellProps) {
  const toneClass =
    tone === "surface"
      ? "bg-surface"
      : tone === "muted"
        ? "bg-muted"
        : tone === "brand"
          ? "bg-primary/5"
          : "bg-background text-foreground";

  const wantsOverlay = Boolean(guidelines) || Boolean(centerLine);
  const centerOpacity =
    typeof centerLine === "object" && typeof centerLine.opacity === "number"
      ? Math.min(1, Math.max(0, centerLine.opacity))
      : 0.30;

  return (
    <section
      {...rest}
      className={cn("border-t", toneClass, wantsOverlay && "relative overflow-visible", className)}
    >
      {/* Custom guidelines overlay, if any */}
      {guidelines}
      {/* Optional center line overlay for parity with marketing center guide */}
      {centerLine ? (
        <div
          aria-hidden="true"
          data-testid="section-centerline"
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(to right, transparent 0, transparent calc(50% - 1px), hsl(var(--border)) calc(50% - 1px), hsl(var(--border)) calc(50% + 1px), transparent calc(50% + 1px))`,
            opacity: centerOpacity,
          }}
        />
      ) : null}
      <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", containerClassName)}>
        {children}
      </div>
    </section>
  );
}


