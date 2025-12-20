"use client";

// Year range control using shared Radix Slider atom
import { Slider } from "@/components/ui/atoms/slider";
import React, { useMemo, useRef } from "react";

type Props = {
  value: [number, number];
  onChange: (range: [number, number]) => void;
  /** Optional commit handler fired when the user finishes interaction */
  onCommit?: (range: [number, number]) => void;
  minYear: number;
  maxYear: number;
  showBubbles?: boolean;
  /** Tighter spacing for use in dense or side-by-side layouts */
  compact?: boolean;
  /** Optional class on outer wrapper */
  className?: string;
  /**
   * Whether to show the current range as a badge next to the label.
   * Default: true (backwards compatible).
   */
  showSelectedIndicator?: boolean;
};

/** Controlled range slider with optional inline value "bubbles" (no custom Slider props required). */
export const YearRangeSlider: React.FC<Props> = ({
  value,
  onChange,
  onCommit,
  minYear,
  maxYear,
  showBubbles = true,
  compact = false,
  className,
  showSelectedIndicator = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [min, max] = value;

  const bubbles = useMemo(() => {
    // Tooltip bubbles are now provided by the Slider atom itself
    // Keep computed helpers for any future positioning needs
    return null;
  }, []);

  return (
    <div className={`${compact ? "mb-2" : "mb-6"} px-1 ${className ?? ""}`.trim()}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-medium text-foreground">Year range</h3>
        {showSelectedIndicator && (
          <span className="rounded border border-border bg-surface px-2 py-1 text-xs text-muted-foreground">
            {min} — {max}
          </span>
        )}
      </div>
      <div ref={containerRef} className="relative">
        {bubbles}
        <Slider
          value={[min, max]}
          onValueChange={(vals) => onChange([vals[0] as number, vals[1] as number])}
          {...(onCommit && { onValueCommit: (vals) => onCommit([vals[0] as number, vals[1] as number]) })}
          min={minYear}
          max={maxYear}
          step={1}
          className="w-full shadow-inner shadow-black/5"
          size="sm"
          thumbSize="lg"
          aria-label="Year range"
          showTooltips={showBubbles}
          formatValue={(n) => String(n)}
        />
        {/* Tick marks at min and max; simple for clarity */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
          <span className="font-medium">{minYear}</span>
          <span className="font-medium">{maxYear}</span>
        </div>
        <div className="relative h-2 mt-1">
          <div className="absolute left-0 top-0 h-2 w-px bg-border" />
          <div className="absolute right-0 top-0 h-2 w-px bg-border" />
        </div>
      </div>
    </div>
  );
};


