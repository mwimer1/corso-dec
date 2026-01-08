"use client";

import * as React from "react";

interface UseNumberInputOptions {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
}

/**
 * useNumberInput – Hook to manage numeric input with stepper controls.
 * Provides clamped increment/decrement functions and disabled state booleans.
 */
export function useNumberInput({ value, min, max, step, onChange }: UseNumberInputOptions) {
  const computedStep = Math.ceil((max - min) / 20);
  const delta = typeof step === "number" && step > 0 ? step : computedStep;

  const inc = React.useCallback(() => {
    const next = Math.min(max, value + delta);
    onChange(next);
  }, [onChange, value, delta, max]);

  const dec = React.useCallback(() => {
    const next = Math.max(min, value - delta);
    onChange(next);
  }, [onChange, value, delta, min]);

  return {
    inc,
    dec,
    canInc: value < max,
    canDec: value > min,
  } as const;
}



