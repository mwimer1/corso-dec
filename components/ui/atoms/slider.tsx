// components/ui/atoms/slider.tsx\n'use client';

import { cn } from "@/styles";
import {
  sliderThumbVariants,
  sliderVariants,
  type SliderVariantProps,
  type SliderThumbVariantProps,
} from "@/styles/ui/atoms";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

/**
 * Slider component props.
 */
export interface SliderProps
  extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange">,
    SliderVariantProps {
  /** Controlled slider value (array of numbers, one per thumb). */
  value: number[];
  /** Handler for value change (controlled usage). Optional for read-only. */
  onValueChange?: (_value: number[]) => void;
  /** Handler fired when the user finishes interaction (commit). */
  onValueCommit?: (_value: number[]) => void;
  /** If true, shows numeric value labels above thumbs. */
  showTooltips?: boolean;
  /** Optional label formatter for tooltip text (e.g., (n) => `${n}\u00B0F`). */
  formatValue?: (value: number, index: number) => string;
  /** Optional size override for the thumb only (lets us keep a skinny track with larger knobs). */
  thumbSize?: SliderThumbVariantProps["size"];
}

/**
 * Slider – a controlled range slider input with tooltips.
 * Supports `intent` (color theme) and `size` variants. Accepts an array of values (for single or multi-handle sliders).
 */
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function Slider(props: SliderProps, ref) {
  const {
    className,
    size = "md",
    showTooltips = false,
    formatValue,
    value,
    onValueChange,
    onValueCommit,
    thumbSize,
    // Be explicit; allow overrides via props spread below.
    min = 0,
    max = 100,
    step = 1,
    ...propsRest
  } = props;
  // Only attach handlers if provided.
  const eventProps = {
    ...(onValueChange && { onValueChange }),
    ...(onValueCommit && { onValueCommit }),
  } as Partial<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>>;

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      {...eventProps}
      className={cn(sliderVariants({ size }), className)}
      min={min}
      max={max}
      step={step}
      suppressHydrationWarning
      {...propsRest}
    >
      <SliderPrimitive.Track
        className={cn(
          "relative flex-1 rounded-full bg-muted",
          "data-[orientation=horizontal]:h-xs",
          "data-[orientation=vertical]:w-xs data-[orientation=vertical]:h-full",
          "data-[disabled]:opacity-50",
        )}
      />
      <SliderPrimitive.Range
        className={cn(
          "absolute rounded-full bg-primary",
          "data-[orientation=horizontal]:h-full",
          "data-[orientation=vertical]:w-full",
        )}
      />
      {value.map((val, i) => {
        // Use index-based key that remains stable during drag operations
        // Value-based keys cause React to unmount/remount thumbs during drag
        const stableKey = `thumb-${i}`;
        return (
          <SliderPrimitive.Thumb
            key={stableKey}
            className={cn(
              sliderThumbVariants({ size: thumbSize ?? size, variant: 'slider' }),
              "block relative bg-white border-2 border-primary shadow-lg rounded-full",
              "cursor-grab active:cursor-grabbing",
              "hover:shadow-xl hover:scale-110 active:scale-105",
              "transition-[box-shadow,transform] duration-200",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
        >
          {showTooltips && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -top-lg left-1/2 -translate-x-1/2 select-none whitespace-nowrap rounded-md bg-muted px-sm py-xs text-xs font-medium text-foreground shadow"
            >
              {formatValue ? formatValue(val, i) : val}
            </span>
          )}
          </SliderPrimitive.Thumb>
        );
      })}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = "Slider";
