// Root Next.js config that composes config/next.config.mjs and adds repo-level redirects
import bundleAnalyzer from '@next/bundle-analyzer';
import base from './config/next.config.mjs';

/** @type {import('next').NextConfig} */
const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

const nextConfig = {
  ...base,
  async redirects() {
    const baseRedirects = typeof base.redirects === 'function' ? await base.redirects() : [];
    return [
      // Legacy legal redirects: point directly to simplified legal paths
      { source: '/legal', destination: '/legal', permanent: true },
      { source: '/legal/terms', destination: '/terms', permanent: true },
      { source: '/legal/privacy', destination: '/privacy', permanent: true },
      { source: '/legal/cookies', destination: '/cookies', permanent: true },
      { source: '/legal/contact', destination: '/contact', permanent: true },
      ...baseRedirects,
      // Auth: redirect legacy combined route to dedicated sign-in
      { source: '/sign-in-or-up', destination: '/sign-in', permanent: true },
      // Redirect legacy account/subscription routes to new dashboard locations
      { source: '/account', destination: '/dashboard/account', permanent: true },
      { source: '/subscription', destination: '/dashboard/subscription', permanent: true },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);

