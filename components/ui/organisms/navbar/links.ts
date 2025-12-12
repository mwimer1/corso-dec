// components/ui/organisms/navbar/links.ts
// NOTE: Pure data, no 'use client' and no React hooks here.

// NavItem type removed - not used anywhere in the codebase

export const PRIMARY_LINKS: ReadonlyArray<Readonly<{
  href: string;
  label: string;
  /** Only include when necessary; exactOptionalPropertyTypes-safe */
  target?: '_self' | '_blank';
  /** Only include when you need to override Next.js default behavior */
  prefetch?: boolean;
}>> = [
  { href: '/insights', label: 'Insights' },
  { href: '/pricing#faq', label: 'FAQ' },
  { href: '/pricing', label: 'Pricing' },
];

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



