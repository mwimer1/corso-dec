// components/ui/organisms/navbar/navbar-helpers.ts
// Helper functions for navbar component logic.
// NOTE: Pure functions, no 'use client' and no React hooks here.

import type { NavItemData } from '@/types/shared';

/**
 * Navbar mode type for type safety.
 */
export type NavbarMode = "app" | "landing" | "minimal" | "insights";

/**
 * Parameters for resolving navigation items.
 */
interface ResolveNavItemsParams {
  /** Optional custom nav items (takes precedence over mode-based defaults) */
  items?: NavItemData[] | undefined;
  /** Navbar mode determining default items */
  mode: NavbarMode;
  /** App mode navigation items */
  appNavItems: NavItemData[];
  /** Landing/insights mode navigation items */
  landingNavItems: NavItemData[];
}

/**
 * Resolves navigation items based on mode and optional override.
 * 
 * Priority:
 * 1. Custom items (if provided and non-empty)
 * 2. Mode-based defaults:
 *    - "app" → appNavItems
 *    - "minimal" → [] (empty array)
 *    - "insights" → landingNavItems
 *    - "landing" → landingNavItems (default)
 * 
 * @param params - Resolution parameters
 * @returns Resolved navigation items array
 * 
 * @example
 * ```tsx
 * const navItems = resolveNavItems({
 *   items: customItems,
 *   mode: "landing",
 *   appNavItems: [{ href: "/dashboard", label: "Dashboard" }],
 *   landingNavItems: [{ href: "/insights", label: "Insights" }]
 * });
 * ```
 */
export function resolveNavItems({
  items,
  mode,
  appNavItems,
  landingNavItems,
}: ResolveNavItemsParams): NavItemData[] {
  // Custom items override mode-based defaults
  if (items && items.length > 0) {
    return items;
  }

  // Mode-based defaults
  switch (mode) {
    case "app":
      return appNavItems;
    case "minimal":
      return [];
    case "insights":
      return landingNavItems;
    case "landing":
    default:
      return landingNavItems;
  }
}
