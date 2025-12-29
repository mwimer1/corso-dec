
const isCI = !!process.env.CI;

/** @type {import('next').NextConfig} */
const INLINE_LIMIT = Number(process.env.NEXT_INLINE_ASSET_LIMIT ?? 8192); // 8KB default
const nextConfig = {
  reactStrictMode: true,
  // Transpile packages that may cause Turbopack externalization warnings
  transpilePackages: [],

  /**
   * Explicitly externalize these packages (Next 15's default list includes them).
   * Declaring them here documents intent and helps some build environments.
   * If you ever decide to BUNDLE these instead, remove them from this list.
   * Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages
   */
  serverExternalPackages: [
    'import-in-the-middle',
    'require-in-the-middle',
    // DuckDB native bindings must be externalized (not bundled)
    '@duckdb/node-api',
    '@duckdb/node-bindings',
    '@duckdb/node-bindings-win32-x64',
    '@duckdb/node-bindings-linux-x64',
    '@duckdb/node-bindings-linux-arm64',
    '@duckdb/node-bindings-darwin-x64',
    '@duckdb/node-bindings-darwin-arm64',
  ],
  async rewrites() {
    return [
      {
        // Proxy Clerk JavaScript files to fix invalid Cache-Control headers
        source: '/clerk-js/:path*',
        destination: 'https://clever-albacore-41.clerk.accounts.dev/npm/@clerk/clerk-js@5/dist/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        // Global security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Fix Cache-Control headers for proxied Clerk JavaScript files
        source: '/clerk-js/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // API: redirect legacy/unversioned paths to versioned/internal equivalents (308)
      { source: '/api/user', destination: '/api/v1/user', permanent: true },
      // Removed: /api/dashboard/query → migrated to /api/v1/entity/{entity}/query
      // Removed: /api/dashboard/generate-sql → migrated to /api/v1/ai/generate-sql
      { source: '/api/subscription/products', destination: '/api/v1/subscription/products', permanent: true },
      { source: '/api/subscription/portal', destination: '/api/v1/subscription/portal', permanent: true },
      // Internal billing routes consolidated under /api/v1
      { source: '/api/internal/billing/checkout', destination: '/api/v1/billing/checkout', permanent: true },
      { source: '/api/internal/billing/portal', destination: '/api/v1/subscription/portal', permanent: true },
      { source: '/api/internal/billing/subscription-status', destination: '/api/v1/billing/subscription-status', permanent: true },
      { source: '/api/billing/test-success', destination: '/api/internal/billing/test-success', permanent: true },

      // Removed: Legacy chat/SQL redirects - endpoints migrated to /api/v1/ai/*

      // App: promote Chat as default dashboard landing
      { source: '/dashboard', destination: '/dashboard/chat', permanent: true },

      // Marketing: move standalone contact to entity-based route (default entity: corso)
      { source: '/contact', destination: '/corso/contact', permanent: true },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Next.js 16 defaults changed - explicitly set if current behavior is important
    // minimumCacheTTL: 60, // Default changed from 60s to 14400s (4 hours) in v16
    // qualities: [75, 50, 25], // Default changed from range to [75] in v16
    maximumRedirects: 3, // Explicitly set (default changed from unlimited to 3 in v16)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'yvwpjlzkygbmlslnqyca.supabase.co',
        pathname: '/storage/v1/object/public/corso-assets/**',
      },
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
    ],
    dangerouslyAllowSVG: true,
    // When allowing remote SVGs via next/image, restrict evaluated SVGs via this CSP
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Note: images.domains is deprecated in Next.js 16, use remotePatterns (already done)
    // Note: If using local images with query strings, add:
    // localPatterns: { search: true },
  },
  // experimental options removed: instrumentationHook is enabled by default in Next 15+
  // Turbopack is now the default bundler in Next.js 16
  // Note: Custom webpack config below will be ignored when using Turbopack (default)
  // Use --webpack flag for builds if webpack config is required temporarily
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  typescript: {
    // We run a separate typecheck step via package.json scripts
    ignoreBuildErrors: true,
  },
  // Source maps: keep on in CI for diagnostics; off locally for faster builds
  productionBrowserSourceMaps: isCI,
  experimental: {
    serverSourceMaps: isCI,
    // Enable Turbopack file system cache for faster dev builds
    turbopackFileSystemCacheForDev: true,
  },
  // Webpack config: Note that Next.js 16 uses Turbopack as default bundler
  // This webpack config will be ignored when using Turbopack (default behavior)
  // To use webpack instead, run: pnpm build --webpack
  // TODO: Migrate webpack-specific rules to Turbopack equivalents when ready
  webpack: (config, { dev, isServer }) => {
    // Only disable persistent cache in CI; keep it locally to speed rebuilds
    if (!dev && isCI) {
      config.cache = false;
    }

    // Note: Test and story file exclusion is handled by bundle size script configuration
    // to avoid webpack configuration complexity and ensure proper exclusion patterns

    // Extra filter to hide the specific Supabase Realtime dynamic require warning in output
    config.stats = {
      ...(config.stats || {}),
      warningsFilter: [
        ...((config.stats && Array.isArray(config.stats.warningsFilter))
          ? config.stats.warningsFilter
          : []),
        /@supabase[\\/]+realtime-js[\\/]+dist[\\/]+module[\\/]+lib[\\/]+websocket-factory\.js/i,
        /Critical dependency: the request of a dependency is an expression/i,
      ],
    };
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      // Explicit pattern-based ignores for Supabase Realtime dynamic requires
      {
        module: /[\\\/]@supabase[\\\/]realtime-js[\\\/]dist[\\\/]module[\\\/]lib[\\\/]websocket-factory\.js$/i,
        message:
          /(Critical dependency: the request of a dependency is an expression|dependencies cannot be statically extracted)/i,
      },
      {
        module: /[\\\/]node_modules[\\\/] .*realtime-js[\\\/]dist[\\\/]module[\\\/]lib[\\\/]websocket-factory\.js$/i,
        message: /Critical dependency/i,
      },
      (warning) => {
        const message = typeof warning === 'string' ? warning : warning?.message || '';
        const file =
          (typeof warning !== 'string' && (warning.file || warning?.module?.resource)) || '';

        const isCriticalDependency =
          /Critical dependency/i.test(message) ||
          /the request of a dependency is an expression/i.test(message) ||
          /dependencies cannot be statically extracted/i.test(message);

        const isSupabaseRealtime =
          /@supabase[\\/]realtime-js[\\/]/.test(file) ||
          /websocket-factory\.js$/i.test(file) ||
          /@supabase[\\/]realtime-js/i.test(message);

        return isCriticalDependency && isSupabaseRealtime;
      },
      // Suppress webpack cache warnings about serializing big strings; tracked separately in asset policy
      {
        message: /Serializing big strings/i,
      },
    ];

    // Handle Sentry/OpenTelemetry transitive dependencies that cause externalization warnings.
    // These packages exist as transitive deps but aren't root-installed, causing Next.js resolution issues.
    if (isServer) {
      config.externals = config.externals || [];

      // Add externals for other problematic packages that are transitive dependencies
      // Note: import-in-the-middle and require-in-the-middle are now handled via serverExternalPackages above

      // Prevent accidental imports of OTEL instrumentation
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '@opentelemetry/instrumentation': false,
      };
    }

    // Tune data URL inlining limit for assets to avoid huge strings in cache
    try {
      const rules = config.module?.rules || [];
      const tune = (rule) => {
        if (rule && typeof rule === 'object') {
          if (rule.type === 'asset' && rule.parser && rule.parser.dataUrlCondition) {
            rule.parser.dataUrlCondition.maxSize = INLINE_LIMIT;
          }
          for (const key of ['oneOf', 'rules']) {
            if (Array.isArray(rule[key])) rule[key].forEach(tune);
          }
        }
      };
      rules.forEach(tune);
    } catch {
      // best-effort; non-fatal if rule traversal fails
    }

    // Reduce infrastructure logging noise from webpack cache pack warnings
    config.infrastructureLogging = {
      ...(config.infrastructureLogging || {}),
      level: 'error',
    };

    return config;
  },
  // Font loading is handled by next/font/google, no webpack config needed
};

export default nextConfig;