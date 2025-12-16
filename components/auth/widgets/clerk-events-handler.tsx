// components/auth/clerk-events-handler.tsx
// Description: Handles Clerk authentication events globally (sign-in, sign-out, etc.).
"use client";

import { logger, publicEnv } from "@/lib/shared";
import * as React from "react";

/**
 * Global event listener component for Clerk authentication events.
 * Mounts on the client side to subscribe to Clerk events (e.g., when the Clerk SDK loads),
 * and logs or handles those events. This prevents silent failures and aids debugging for auth flows.
 */
export function ClerkEventsHandler(): React.JSX.Element | null {
  React.useEffect(() => {
    const stage = publicEnv.NEXT_PUBLIC_STAGE ?? "production";
    const level = publicEnv.NEXT_PUBLIC_APP_VERSION ?? "info";
    const shouldLog = stage !== "production" && level !== "silent";
    if (!shouldLog) return;

    logger.debug("ClerkEventsHandler mounted", { stage, level });

    // Example Clerk event subscription: log when the Clerk frontend SDK finishes loading
    const handleClerkLoaded = () => {
      logger.info("Clerk SDK loaded");
    };

    window.addEventListener("clerk-loaded", handleClerkLoaded);

    // Optional: feature-detect Clerk browser events (safe no-op if unavailable)
    const anyWin = window as unknown as { Clerk?: { addListener?: (cb: (e: unknown) => void) => () => void } };
    const off = anyWin.Clerk?.addListener?.((evt: unknown) => {
      logger.debug?.("Clerk event", { evt });
    });

    return () => {
      window.removeEventListener("clerk-loaded", handleClerkLoaded);
      if (typeof off === "function") off();
    };
  }, []);

  return null; // No UI; this component only subscribes to events.
}
