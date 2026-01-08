// components/insights/layout/nav.config.ts
import { APP_LINKS } from '@/lib/shared';
import type { NavItemData } from "@/types/shared";

const insightsNavItems: NavItemData[] = [
  { label: "All Insights", href: APP_LINKS.NAV.INSIGHTS },
  // Categories link removed - no index page exists at /insights/categories
  // Individual category pages are accessible via /insights/categories/[category]
  { label: "About", href: "/about" },
  // Insights-focused navigation - no pricing/FAQ
];

/** Public-site insights navigation: allows optional override, defaults to insights items. */
export function getInsightsNavItems(override?: NavItemData[]): NavItemData[] {
  return override && override.length ? override : insightsNavItems;
}


