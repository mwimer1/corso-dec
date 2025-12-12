// Asset resolver is server/client-safe; do not force client module

// Local public asset resolver - prefer local `public/` files to avoid remote CDN lookups
// This keeps Next.js Image optimization working with local static assets and avoids
// runtime failures when external CDN env vars are misconfigured.

// Prefer static imports for local build-time assets. These are fallbacks that will be
// overwritten when consumers import the assets directly from `assets/demos`.

export const BrandAssets = {
  // Public root files are served at the app root: `/logo.svg`, `/favicon.ico`
  logo: '/logo.svg',
  favicon: '/favicon.ico',
} as const;



