"use client";

// components/insights/layout/navbar.tsx
// Insights page navbar wrapper around shared UI navbar with insights-specific features

import { Navbar } from "@/components/ui/organisms";
import type { NavItemData } from "@/types/shared";
import * as React from "react";
import { getInsightsNavItems } from "./nav.config";

interface InsightsNavbarProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional override for primary nav items (insights-specific) */
  items?: NavItemData[] | undefined;
  /** Whether to show breadcrumb navigation (for article pages) */
  showBreadcrumbs?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function InsightsNavbar({
  items,
  showBreadcrumbs: _showBreadcrumbs = false,
  className,
  ...props
}: InsightsNavbarProps): React.ReactElement {
  const navItems = getInsightsNavItems(items);

  return (
    <Navbar
      mode="insights"
      items={navItems.length > 0 ? navItems : undefined}
      forceShowCTAs={true} // Always show public CTAs (Sign in / Start for free) for marketing pages
      showBreadcrumbs={false} // Never show breadcrumbs in insights navbar - use logo for home navigation
      className={className}
      {...props}
    />
  );
}
