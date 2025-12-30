// Set environment variable for Enterprise features (tests require SSRM)
// MUST be set before any modules are loaded to ensure publicEnv reads it correctly
if (!process.env.NEXT_PUBLIC_AGGRID_ENTERPRISE) {
  process.env.NEXT_PUBLIC_AGGRID_ENTERPRISE = '1';
}

import { fileURLToPath } from "node:url";
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from "vitest/config";
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// NOTE: Keep alias-only imports in app code; tests may mock edge/server boundaries.
// These aliases avoid runtime guard explosions when importing server/edge code in Node.
const alias = {
  // Root shorthand
  '@': r('./'),

  // Canonical barrels (client/shared)
  '@/lib': r('./lib'),
  '@/components': r('./components'),
  '@/styles': r('./styles'),
  '@/types': r('./types'),
  '@/hooks': r('./hooks'),
  '@/contexts': r('./contexts'),
  '@/app': r('./app'),
  '@/scripts': r('./scripts'),

  // Server-only namespace (resolvable for Node tests only)
  '@/lib/server': r('./lib/server'),

  // Explicit dashboard barrels: client vs server
  '@/components/dashboard': r('./components/dashboard'),

  // Explicit common barrels used by tests
  '@/lib/actions': r('./lib/actions/index.ts'),
  '@/lib/actions/validation': r('./lib/actions/validation.ts'),
  '@/lib/api': r('./lib/api/index.ts'),
  '@/lib/auth/client': r('./lib/auth/client.ts'),
  '@/lib/auth/server': r('./lib/auth/server.ts'),
  '@/lib/security': r('./lib/security/index.ts'),
  '@/lib/shared/analytics/track': r('./lib/shared/analytics/track.ts'),
  '@/lib/integrations/env': r('./lib/server/env.ts'),
  '@/lib/ratelimiting': r('./lib/ratelimiting/index.ts'),
  '@/lib/middleware/http/cors': r('./lib/middleware/http/cors.ts'),
  '@/lib/monitoring': r('./lib/monitoring/index.ts'),
  '@/components/ui/molecules/select': r('./components/ui/molecules/select.tsx'),
  // Component-level aliases used in DOM tests
  '@/atoms': r('./components/ui/atoms/index.ts'),
  '@/atoms/*': r('./components/ui/atoms/*'),
  '@/molecules': r('./components/ui/molecules/index.ts'),
  '@/molecules/*': r('./components/ui/molecules/*'),
  '@/organisms': r('./components/ui/organisms/index.ts'),
  '@/organisms/*': r('./components/ui/organisms/*'),
  '@/components/ui/atoms': r('./components/ui/atoms'),
  '@/components/auth': r('./components/auth'),
  '@/components/billing/subscription-client': r('./components/billing/subscription-client.tsx'),
  '@/components/dashboard/sidebar/sidebar-context': r('./components/dashboard/sidebar/sidebar-context.tsx'),
  '@/components/dashboard/sidebar/sidebar-item': r('./components/dashboard/sidebar/sidebar-item.tsx'),
  '@/components/dashboard/sidebar/sidebar-root': r('./components/dashboard/sidebar/sidebar-root.tsx'),
  '@/components/dashboard/sidebar/sidebar-tooltip': r('./components/dashboard/sidebar/sidebar-tooltip.tsx'),
  '@/components/dashboard/sidebar/sidebar-top': r('./components/dashboard/sidebar/sidebar-top.tsx'),
  '@/components/dashboard/sidebar/sidebar-user-profile': r('./components/dashboard/sidebar/sidebar-user-profile.tsx'),
  '@/components/dashboard/sidebar/sidebar-tooltip-layer': r('./components/dashboard/sidebar/sidebar-tooltip-layer.tsx'),
  '@/components/dashboard/header/corso-ai-mode': r('./components/dashboard/header/corso-ai-mode.tsx'),
  '@/components/dashboard/header/dashboard-header': r('./components/dashboard/header/dashboard-header.tsx'),
  '@/components/dashboard/header/saved-view-select': r('./components/dashboard/header/saved-view-select.tsx'),
  '@/components/ui/atoms/index': r('./components/ui/atoms/index.ts'),

  // Test support aliases (for stable test imports)
  '@/tests': r('./tests'),
  '@/tests/support': r('./tests/support'),
  '@/tests/support/mocks': r('./tests/support/mocks'),

  // Next mocks (kept in tests/support/mocks)
  'server-only': r('./tests/support/mocks/server-only.ts'),
  'next/headers': r('./tests/support/mocks/next-headers.ts'),
  'next/cache': r('./tests/support/mocks/next-cache.ts'),
  'next/navigation': r('./tests/support/mocks/next-navigation.ts'),
};

export default defineConfig({
  test: {
    // Default timeouts to reduce flaky CI failures
    testTimeout: 20000,
    hookTimeout: 20000,
    reporters: process.env.CI
      ? ['default', ['junit', { outputFile: 'reports/vitest-junit.xml' }]]
      : ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/__tests__/**',
        '**/__mocks__/**',
        '**/*.config.{ts,js,mjs}',
        '**/dist/**',
        '**/.next/**',
        '**/coverage/**',
        '**/scripts/**',
        '**/types/**',
        '**/docs/**',
      ],
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 70,
        statements: 80,
      },
    },
    // Use projects instead of deprecated workspace
    projects: [
      {
        plugins: [tsconfigPaths()],
        resolve: { alias },
        test: {
          name: 'node',
          environment: 'node',
          include: [
            'tests/api/**/*.test.{ts,tsx}',
            'tests/auth/**/*.test.{ts,tsx}',
            'tests/chat/**/*.test.{ts,tsx}',
            'tests/dashboard/**/*.test.{ts,tsx}',
            'tests/insights/**/*.test.{ts,tsx}',
            'tests/security/**/*.test.{ts,tsx}',
            'tests/core/**/*.test.{ts,tsx}',
            'tests/runtime-boundary/**/*.test.{ts,tsx}',
            'tests/styles/**/*.test.{ts,tsx}',
            'tests/**/*.node.test.{ts,tsx}',
            'tests/scripts/**/*.test.{ts,tsx}',
            'scripts/**/__tests__/**/*.test.ts',
          ],
          exclude: ['tests/**/*.dom.test.{ts,tsx}'],
          setupFiles: [
            'tests/support/setup/vitest.setup.shared.ts',
            'tests/support/setup/vitest.setup.node.ts'
          ],
          globals: true,
        },
      },
      {
        plugins: [tsconfigPaths()],
        resolve: { alias },
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['tests/**/*.dom.test.{ts,tsx}'],
          setupFiles: [
            'tests/support/setup/vitest.setup.shared.ts',
            'tests/support/setup/vitest.setup.dom.ts'
          ],
          globals: true,
        },
      },
    ],
  },
});

