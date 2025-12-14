// components/landing/nav.config.ts
import { APP_LINKS } from '@/components';
import type { NavItemData } from "@/types/shared";

export const landingNavItems: NavItemData[] = [
  { label: "Insights", href: APP_LINKS.NAV.INSIGHTS },
  // Swapped order: show FAQ before Pricing
  { label: "FAQ", href: APP_LINKS.NAV.FAQ },
  { label: "Pricing", href: APP_LINKS.NAV.PRICING },
  // Removed 'Log in' from center nav; Sign in lives in right CTA
];

/** Public-site only: allows optional override, defaults to landing items. */
export function getLandingNavItems(override?: NavItemData[]): NavItemData[] {
  return override && override.length ? override : landingNavItems;
}

