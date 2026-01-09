// components/ui/organisms/navbar/links.ts
// NOTE: Pure data, no 'use client' and no React hooks here.
// Canonical source of truth for marketing/landing navigation links.

import { APP_LINKS } from '@/lib/shared';
import type { NavItemData } from '@/types/shared';

export const PRIMARY_LINKS: ReadonlyArray<Readonly<{
  href: string;
  label: string;
  /** Only include when necessary; exactOptionalPropertyTypes-safe */
  target?: '_self' | '_blank';
  /** Only include when you need to override Next.js default behavior */
  prefetch?: boolean;
}>> = [
  { href: APP_LINKS.NAV.INSIGHTS, label: 'Insights' },
  { href: APP_LINKS.NAV.FAQ, label: 'FAQ' },
  { href: APP_LINKS.NAV.PRICING, label: 'Pricing' },
];

/**
 * Landing/marketing navigation items as NavItemData[].
 * This is the canonical source for marketing page navigation.
 * 
 * @example
 * ```tsx
 * import { landingNavItems } from '@/components/ui/organisms/navbar/links';
 * <PublicLayout navMode="landing" navItems={landingNavItems} />
 * ```
 */
export const landingNavItems: NavItemData[] = PRIMARY_LINKS.map((link) => ({
  href: link.href,
  label: link.label,
}));

export const CTA_LINKS: ReadonlyArray<Readonly<{
  href: string;
  label: string;
  /** Only include when necessary; exactOptionalPropertyTypes-safe */
  target?: '_self' | '_blank';
  /** Only include when you need to override Next.js default behavior */
  prefetch?: boolean;
}>> = [
  { href: '/sign-in', label: 'Sign in' },
  { href: '/sign-up', label: 'Start for free' },
];



