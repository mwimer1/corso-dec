"use client";

import { formatCurrencyCompact, formatNumberCompact } from "@/lib/shared";
import React from "react";
import { useAnimatedNumber } from "../hooks/use-animated-number";

type Mode = "number" | "currency";

export const AnimatedNumber: React.FC<{ value: number; mode?: Mode; durationMs?: number } & React.HTMLAttributes<HTMLSpanElement>> = ({
  value,
  mode = "number",
  durationMs = 1000,
  className,
  ...rest
}) => {
  const animated = useAnimatedNumber(value, durationMs);
  const formatted = mode === "currency"
    ? formatCurrencyCompact(Number(Math.round(animated)))
    : formatNumberCompact(Number(Math.round(animated)));

  return (
    <span className={className} aria-live="polite" aria-atomic="true" {...rest}>
      {formatted}
    </span>
  );
};


