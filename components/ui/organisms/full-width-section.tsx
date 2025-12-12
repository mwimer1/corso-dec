// components/ui/organisms/full-width-section.tsx\n'use client';

import { cn } from "@/styles";
import {
    fullWidthSectionContainerVariants,
    fullWidthSectionGuidelinesVariants,
    fullWidthSectionVariants,
    type FullWidthSectionContainerVariantProps,
    type FullWidthSectionGuidelinesVariantProps,
    type FullWidthSectionVariantProps
} from "@/styles/ui/organisms";
import React from "react";

interface FullWidthSectionProps
  extends FullWidthSectionVariantProps,
    Omit<FullWidthSectionContainerVariantProps, "maxWidth" | "padding">,
    Pick<FullWidthSectionGuidelinesVariantProps, "visibility" | "opacity"> {
  id?: string;
  showVerticalGuidelines?: boolean;
  /** Alias for showVerticalGuidelines (back-compat) */
  showVerticalGuides?: boolean;
  /** Extend guideline overlay above the section (in pixels). Default: 1 */
  guidelineOverlapTopPx?: number;
  /** Extend guideline overlay below the section (in pixels). Default: 1 */
  guidelineOverlapBottomPx?: number;
  /** Which guideline edges to render (default: both) */
  guidelineSide?: "both" | "left" | "right";
  /** Tailwind class for guideline color (default: bg-border/70) */
  guidelineColor?: string;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  /** Container max width variant */
  containerMaxWidth?: FullWidthSectionContainerVariantProps["maxWidth"];
  /** Container padding variant */
  containerPadding?: FullWidthSectionContainerVariantProps["padding"];
  /** Alias for visibility (back-compat) */
  guidesVisibility?: FullWidthSectionGuidelinesVariantProps["visibility"];
  /** Back-compat: new prop introduced in recent refactor; make optional */
  visibility?: FullWidthSectionGuidelinesVariantProps["visibility"];
}

/**
 * FullWidthSection – a horizontally full-width section with optional background color.
 * Provides built-in max-width and padding for inner content, and optional 12-column guideline overlay.
 */
function FullWidthSection({
  id,
  background = "default",
  padding = "md",
  overflow = "visible",
  showVerticalGuidelines = false,
  showVerticalGuides,
  guidelineOverlapTopPx = 1,
  guidelineOverlapBottomPx = 1,
  guidelineSide = "both",
  visibility,
  guidesVisibility,
  opacity = "medium",
  containerMaxWidth = "xl",
  containerPadding = "lg",
  guidelineColor = "bg-border",
  children,
  className,
  containerClassName,
}: FullWidthSectionProps) {
  // Back-compat alias resolution
  const resolvedShowGuides =
    typeof showVerticalGuides === "boolean"
      ? showVerticalGuides
      : showVerticalGuidelines;
  // tolerate both old `guidesVisibility` and new `visibility` prop
  const resolvedVisibility = visibility ?? guidesVisibility ?? "always";

  const showGuides = resolvedShowGuides && background === "default";

  return (
    <section
      id={id}
      className={cn(
        fullWidthSectionVariants({ background, padding, overflow }),
        className,
      )}
    >
      {/* Inner content container (aligns with global page padding) */}
      <div
        className={cn(
          fullWidthSectionContainerVariants({
            maxWidth: containerMaxWidth,
            padding: containerPadding,
          }),
          containerClassName,
        )}
      >
        {children}
      </div>

      {/* Optional vertical container-edge guidelines (aligned with navbar gutters) */}
      {showGuides && (
        <div
          className={cn(
            fullWidthSectionGuidelinesVariants({ visibility: resolvedVisibility, opacity }),
          )}
          aria-hidden="true"
          style={
            guidelineOverlapTopPx || guidelineOverlapBottomPx
              ? {
                  // Extend rails beyond section bounds for seamless continuity across sections
                  top: guidelineOverlapTopPx ? `-${guidelineOverlapTopPx}px` : undefined,
                  bottom: guidelineOverlapBottomPx ? `-${guidelineOverlapBottomPx}px` : undefined,
                }
              : undefined
          }
        >
          <div
            className={cn(
              fullWidthSectionContainerVariants({
                maxWidth: containerMaxWidth,
                padding: containerPadding,
              }),
              // Use relative container to position left/right lines at inner gutters
              'relative h-full w-full',
            )}
          >
            {guidelineSide !== "right" && (
              <div className={cn("absolute inset-y-0 left-0 w-px", guidelineColor)} />
            )}
            {guidelineSide !== "left" && (
              <div className={cn("absolute inset-y-0 right-0 w-px", guidelineColor)} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}

export { FullWidthSection };

