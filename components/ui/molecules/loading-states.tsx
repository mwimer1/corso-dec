// components/ui/molecules/loading-states.tsx\n// FILE: app/_components/ui/molecules/loading-states.tsx
"use client";

import { Spinner } from "@/components/ui/atoms/spinner";
import { cn } from "@/styles";
import { loadingStates } from "@/styles/ui/molecules";
import * as React from "react";

/** Full-screen loading overlay */
interface FullScreenLoadingOverlayProps {
  /** Optional loading message */
  message?: string;
}
const FullScreenLoadingOverlay = React.forwardRef<
  HTMLDivElement,
  FullScreenLoadingOverlayProps
>(({ message, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(loadingStates({ state: "loading", size: "md" }))}
    aria-busy="true"
    role="status"
    {...props}
  >
    <Spinner size="lg" variant="default" />
    {message && <p className="mt-sm text-center">{message}</p>}
  </div>
));
FullScreenLoadingOverlay.displayName = "FullScreenLoadingOverlay";
