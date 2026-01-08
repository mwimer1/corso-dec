"use client";

// Year range control using shared Radix Slider atom
import { Slider } from "@/components/ui/atoms/slider";
import { Badge } from "@/components/ui/atoms/badge";
import React, { useMemo, useRef, useCallback } from "react";

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

  // Memoize handlers to prevent recreation on every render
  // This ensures Radix UI maintains stable references during drag operations
  const handleValueChange = useCallback((vals: number[]) => {
    onChange([vals[0] as number, vals[1] as number]);
  }, [onChange]);

  const handleValueCommit = useCallback((vals: number[]) => {
    onCommit?.([vals[0] as number, vals[1] as number]);
  }, [onCommit]);

  // Memoize value array to prevent unnecessary prop changes
  const sliderValue = useMemo(() => [min, max] as [number, number], [min, max]);

  return (
    <div className={`${compact ? "mb-2" : "mb-6"} px-1 ${className ?? ""}`.trim()}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Year range</h3>
        {showSelectedIndicator && (
          <Badge color="secondary" className="text-xs">
            {min}–{max}
          </Badge>
        )}
      </div>
      <div ref={containerRef} className="relative">
        {bubbles}
        <Slider
          value={sliderValue}
          onValueChange={handleValueChange}
          {...(onCommit && { onValueCommit: handleValueCommit })}
          min={minYear}
          max={maxYear}
          step={1}
          className="w-full"
          size="sm"
          thumbSize="xl"
          aria-label="Year range"
          showTooltips={showBubbles}
          formatValue={(n) => String(n)}
        />
        {/* Tick marks at min and max; simple for clarity */}
        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
          <span className="font-medium">{minYear}</span>
          <span className="font-medium">{maxYear}</span>
        </div>
      </div>
    </div>
  );
};


