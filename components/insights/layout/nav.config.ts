// components/insights/layout/nav.config.ts
import { APP_LINKS } from '@/lib/shared';
import type { NavItemData } from "@/types/shared";

const insightsNavItems: NavItemData[] = [
  { label: "All Insights", href: APP_LINKS.NAV.INSIGHTS },
  { label: "Categories", href: "/insights/categories" },
  { label: "About", href: "/about" },
  // Insights-focused navigation - no pricing/FAQ
];

/** Public-site insights navigation: allows optional override, defaults to insights items. */
export function getInsightsNavItems(override?: NavItemData[]): NavItemData[] {
  return override && override.length ? override : insightsNavItems;
}


