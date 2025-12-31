// Unified components public surface.
// Consumers must import from "@/components".

/** @module components */

// Shared constants and utilities facade (client-safe)
// Import from shared barrel to avoid deep import violation
export { APP_LINKS } from "@/lib/shared";

export * from "./marketing/sections/pricing/plan-ui";
export * from "./ui/atoms";
export * from "./ui/molecules";
export * from "./ui/organisms";
export * from "./ui/patterns";
export * from "./ui/segmented-control";
export * from "./ui/shared";


