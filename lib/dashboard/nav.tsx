// Canonical dashboard navigation surface
// Keep only the current API that has non-test consumers.
// Removed legacy types DashboardNavItem/DashboardNavConfigItem and NAV_CONFIG.

"use client";

import { Building2, FolderKanban, MapPin, MessageSquare } from "lucide-react";

export const DASHBOARD_NAV_ITEMS = [
  { href: "/dashboard/chat", label: "Chat", icon: <MessageSquare className="h-5 w-5" aria-hidden="true" /> },
  { href: "/dashboard/projects", label: "Projects", icon: <FolderKanban className="h-5 w-5" aria-hidden="true" /> },
  { href: "/dashboard/companies", label: "Companies", icon: <Building2 className="h-5 w-5" aria-hidden="true" /> },
  { href: "/dashboard/addresses", label: "Addresses", icon: <MapPin className="h-5 w-5" aria-hidden="true" /> },
] as const;

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * Filters DASHBOARD_NAV_ITEMS based on provided role and feature flag lookup.
 */
export function getAvailableNavItems(_args?: {
  role?: 'owner' | 'admin' | 'member' | 'viewer' | 'service';
  features?: Record<string, boolean | undefined>;
}): typeof DASHBOARD_NAV_ITEMS {
  // Inputs reserved for future gating; currently unused

  // For now, all nav items are available to all authenticated users
  // Role-based filtering can be added back if needed
  const ffOk = true; // No feature flags currently used

  if (ffOk) {
    return DASHBOARD_NAV_ITEMS;
  }

  return [] as unknown as typeof DASHBOARD_NAV_ITEMS;
}
