// components/ui/atoms/slider.tsx\n'use client';

import { cn } from "@/styles";
import {
    sliderThumbVariants,
    sliderVariants,
    type SliderVariantProps,
} from "@/styles/ui/atoms";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

/**
 * Slider – a controlled range slider input with tooltips.
 * Supports `intent` (color theme) and `size` variants. Accepts an array of values (for single or multi-handle sliders).
 */
export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange"> & SliderVariantProps & {
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
    thumbSize?: SliderVariantProps["size"];
  }
>(function Slider(
  props: Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, "value" | "onValueChange"> & SliderVariantProps & {
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
    thumbSize?: SliderVariantProps["size"];
  },
  ref: React.ForwardedRef<React.ElementRef<typeof SliderPrimitive.Root>>,
) {
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
      {value.map((val, i) => (
        <SliderPrimitive.Thumb
          key={`thumb-${val}`}
          className={cn(
            sliderThumbVariants({ size: thumbSize ?? size, variant: 'slider' }),
            "relative bg-background border border-border shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = "Slider";
