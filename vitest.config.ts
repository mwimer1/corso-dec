// Set environment variable for Enterprise features (tests require SSRM)
// MUST be set before any modules are loaded to ensure publicEnv reads it correctly
if (!process.env.NEXT_PUBLIC_AGGRID_ENTERPRISE) {
  process.env.NEXT_PUBLIC_AGGRID_ENTERPRISE = '1';
}

import { fileURLToPath } from "node:url";
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from "vitest/config";
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// NOTE: vite-tsconfig-paths handles most path aliases from tsconfig.
// Only test-specific mocks and deep imports that aren't in tsconfig are listed here.
const alias = {
  // Next.js mocks (required for Node test environment)
  'server-only': r('./tests/support/mocks/server-only.ts'),
  'next/headers': r('./tests/support/mocks/next-headers.ts'),
  'next/cache': r('./tests/support/mocks/next-cache.ts'),
  'next/navigation': r('./tests/support/mocks/next-navigation.ts'),
};

export default defineConfig({
  // Root-level path resolution - applies to all projects
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      ...alias,
      '@': r('./'),
    },
  },
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
        extends: true,
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
            'tests/lib/**/*.test.{ts,tsx}',
            'tests/runtime-boundary/**/*.test.{ts,tsx}',
            'tests/routes/**/*.test.{ts,tsx}',
            'tests/styles/**/*.test.{ts,tsx}',
            'tests/**/*.node.test.{ts,tsx}',
            'tests/scripts/**/*.test.{ts,tsx}',
            'scripts/**/__tests__/**/*.test.ts',
          ],
          exclude: [
            'tests/**/*.dom.test.{ts,tsx}',
            'scripts/**/__tests__/git.test.ts', // Standalone script, not a Vitest test
          ],
          setupFiles: [
            'tests/support/setup/vitest.setup.shared.ts',
            'tests/support/setup/vitest.setup.node.ts'
          ],
          globals: true,
        },
      },
      {
        extends: true,
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

