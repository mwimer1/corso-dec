// ESLint Flat Config - v9
import nextPlugin from '@next/eslint-plugin-next';

// eslint.config.mjs  – flat config for ESLint v9
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import vitest from 'eslint-plugin-vitest';
// import typesConfig from './config/eslint/types.eslintrc.json';
import corso from './eslint-plugin-corso/dist/index.js';
// with { type: 'json' };

/** files/directories the linter should ignore entirely */
const ignores = [
  '.next/**',
  'node_modules/**',
  'out/**',
  'build/**',
  'dist/**',
  'eslint-plugin-corso/dist/**',
  'eslint-plugin-corso/src/**',
  'dev-tools/coverage/**',
  'coverage/**',
  'reports/**',
  '*.js',
  'scripts/**/*.js',
  'jest/**',
  'public/**',
  // Ignore legacy MVP subtree from lint/type-project parsing
  'CorsoAI/**',
  'pnpm-lock.yaml',
  'tsconfig.tsbuildinfo',
  'dependency-graph.{dot,svg}',
  'styles/build/tailwind.css',
  '**/*.d.ts',
  '.githooks/**', // Prevent duplicate .githooks directory
  'var/**', // Build artifacts and inventory files
  '.cache/**', // ESLint and other tool caches
  '.turbo/**', // Turborepo cache

  'docs/index.ts', // generated docs index
  'docs/examples/**', // Example files for documentation
  'grid-reference/**', // Temporary reference files
];

/** reusable parserOptions */
const tsParserOptions = {
  ecmaVersion: 2022,
  sourceType: 'module',
  project: ['./config/typescript/tsconfig.eslint.json'],
  tsconfigRootDir: import.meta.dirname,
};

// Temporary warning to flag deprecated Inter font identifiers
const deprecatedInterRule = {
  files: ['**/*.{ts,tsx}'],
  rules: {
    'no-restricted-syntax': [
      'warn',
      {
        selector: "ImportSpecifier[imported.name='interVariable'],Identifier[name='interVariable']",
        message: "Use latoVariable from '@/styles/fonts' instead of interVariable (temporary deprecation warning)."
      },
      {
        selector: "ImportSpecifier[imported.name='inter'],Identifier[name='inter']",
        message: "Use 'lato' from '@/styles/fonts' instead of 'inter' (temporary deprecation warning)."
      }
    ]
  }
};

export default [
  //---------------------------------------------------------------------------
  // 0 ) global ignores
  //---------------------------------------------------------------------------
  { ignores },
  // Hint: run ESLint with cache locally for faster reruns: `pnpm exec eslint . --cache --cache-location .eslintcache`
  // Ensure tooling caches are ignored even if external tooling writes to unexpected folders
  {
    // Additional explicit ignores for Flat Config consumers
    ignores: [
      '**/node_modules/**',
      '.cache/**',
      'coverage/**',
      'dist/**',
      '.next/**',
      'out/**',
      'playwright-report/**',
      'reports/**',
      'tmp/**',
    ],
  },
  //---------------------------------------------------------------------------
  // 0a ) React import hardening
  //---------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // Ban direct process.env usage in TS/TSX – use getEnv()/requireServerEnv()
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: 'Use getEnv()/requireServerEnv() instead of process.env',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@/styles/ui', message: 'Import from category barrels (@/styles/ui/atoms, /molecules, /organisms) instead of @/styles/ui.' },
            { name: 'react/jsx-runtime', message: 'Do not import from react/jsx-runtime. Import from react.' },
            { name: 'react/jsx-dev-runtime', message: 'Do not import from react/jsx-dev-runtime. Import from react.' },
            { name: '@clerk/nextjs/server', message: 'Server-only. Do not import in client components.' },
            { name: 'server-only', message: 'Server-only. Do not import in client components.' },
            { name: 'node:*', message: 'Node built-ins are server-only.' },
            // Prevent direct use of util._extend in our codebase
            { name: 'node:util', importNames: ['_extend'], message: 'Do not use util._extend (deprecated). Use Object.assign instead.' },
            { name: 'util', importNames: ['_extend'], message: 'Do not use util._extend (deprecated). Use Object.assign instead.' },
            // Block reintroduction of deprecated TanStack table components
            { name: '@/components/dashboard/table/data-table-container', message: 'Deprecated: use AgGridContainer instead.' },
            { name: '@/components/dashboard/table/table-pro', message: 'Deprecated: use AgGridContainer instead.' },
            { name: '@/components/dashboard/table/table-head-base', message: 'Deprecated: AG Grid header handles sorting/resizing.' },
            { name: '@/components/dashboard/table/data-table-pagination', message: 'Deprecated: AG Grid handles pagination internally.' },
            { name: '@/components/dashboard/table/data-table-view-options', message: 'Deprecated: toggle via columnApi.setColumnVisible.' },
            { name: '@/components/dashboard/table/table-body-virtual', message: 'Deprecated: AG Grid virtualization replaces this.' },
            { name: '@/components/dashboard/table/use-data-table', message: 'Deprecated: use AgGridContainer datasource approach.' },
            { name: '@/components/dashboard/table/table-chrome', message: 'Deprecated: use AgGridContainer.' },
            { name: '@/lib/dashboard/**', message: 'lib/dashboard/** is deprecated. Use @/lib/entities/** instead.' },
            { name: '@/lib/services', message: 'lib/services/ is removed. Use @/lib/entities/** instead.' },
            { name: '@/lib/services/**', message: 'lib/services/** is removed. Use @/lib/entities/** instead.' },
            // Prevent re-introduction of legacy realtime stub
            { name: '@/lib/realtime/live', message: 'Removed legacy realtime stub. Use the event bus or queue service instead.' },
            // Block imports from shared variants barrel to encourage domain imports
            // Policy: Use domain barrels (atoms/molecules/organisms) when possible.
            // Deep imports from @/styles/ui/shared/* are allowed for utilities that don't fit domain barrels
            // (e.g., container-base, container-helpers, focus-ring, typography-variants).
            // Exception: Tests can mock @/styles/ui barrel (see tests/** override).
            { name: '@/styles/ui/shared', message: 'Import from domain barrels (atoms/molecules/organisms) when possible, or use deep imports @/styles/ui/shared/* for shared utilities.' },
            { name: '@/styles/ui/shared/component-variants', message: 'Import from domain barrels instead.' },
            // Prevent deep imports to deleted shared variant files
            { name: '@/styles/ui/shared/article-content', message: 'Deleted file. Use typography-variants for headers and prose classes for content.' },
            { name: '@/styles/ui/shared/callout', message: 'Deleted file. Use inline callout styling or surface-interactive.' },
            { name: '@/styles/ui/shared/cta-base', message: 'Deleted file. CTA styling inlined in button-variants.' },
            { name: '@/styles/ui/shared/form-input-base', message: 'Deleted file. Form styling inlined in input/select/text-area variants.' },
            { name: '@/styles/ui/shared/interactive-base', message: 'Deleted file. Interactive styling inlined in slider/switch/toggle variants.' },
            { name: '@/styles/ui/shared/card-container', message: 'Deleted file. Card styling inlined in alert-box/content-card variants.' },
            { name: '@/styles/ui/shared/chart-container', message: 'Deleted file. Chart styling inlined in result-panel variants.' },
            { name: '@/lib/env/public', message: 'Use "@/lib/shared/config/client" directly. The re-export wrapper was removed.' },
          ],
        },
      ],
    },
  },
  // Enforce: inside components/** don't import the root components barrels (cycle risk)
  {
    files: ['components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/components',
                // '@/components/index' was removed as an orphan; keep folder-scoped guard
                '@/components/ui',
                '@/components/ui/index',
              ],
              message:
                'Inside components/** do not import the root barrels (cycle risk). Import leaf modules (atoms/molecules/organisms) or relative paths.'
            },
          ],
        },
      ],
    },
  },
  // Enforce: inside lib/shared/** don't import the lib/shared barrel (cycle risk)
  {
    files: ['lib/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/shared', '@/lib/shared/*'],
              message: 'Leafs in lib/shared/** must not import the lib/shared barrel. Use relative leaf imports.'
            },
          ],
        },
      ],
    },
  },
  // Enforce: inside lib/validators/** don't import the lib/validators barrel (cycle risk)
  {
    files: ['lib/validators/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/validators', '@/lib/validators/*'],
              message: 'Leafs in lib/validators/** must not import the lib/validators barrel. Use relative leaf imports.'
            },
          ],
        },
      ],
    },
  },
  // CTA-specific rules for landing components (migrated from AST-Grep)
  {
    files: ['components/landing/**/*.{ts,tsx}'],
    rules: {
      'corso/cta-require-linktrack-or-tracking': 'warn',
      'corso/cta-internal-link-to-link': 'warn',
      'corso/cta-external-anchor-hardening': 'warn',
      'corso/cta-add-link-import': 'warn',
      'corso/no-server-only-in-client': 'error',
    },
  },
  //---------------------------------------------------------------------------
  // 1 ) TypeScript / React files
  //---------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['tests/**/*'], // Exclude test files from strict dependency rules
    languageOptions: { parser: tsParser, parserOptions: tsParserOptions },
    plugins: {
      '@typescript-eslint': tsPlugin,
      // boundaries,  // TEMPORARY: Disabled for performance
      'jsx-a11y': jsxA11y,
      jsdoc,
      'import': importPlugin,
      'react-hooks': reactHooks,
      react,
      corso,
      'no-hardcoded-links': {
        rules: {
          '@corso/no-hardcoded-links': 'error',
        },
      },
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx'] },
        typescript: {
          alwaysTryTypes: true,
          project: ['./config/typescript/tsconfig.eslint.json', './tsconfig.json'],
        },
      },
    },
    rules: {
      // Explicitly specify a curated subset of corso rules without invoking corso.configs at config load
      'corso/no-cross-domain-imports': ['error', { configPath: './eslint-plugin-corso/rules/domain-config.json' }],
      'corso/no-deep-imports': ['error', { configPath: './eslint-plugin-corso/rules/domain-config.json' }],
      'corso/no-client-apis-in-server-components': 'warn',
      'corso/require-client-directive-for-client-code': 'warn',
      'corso/no-mixed-runtime-exports': 'warn',
      'corso/use-server-directive': 'off',
      'corso/enforce-action-validation': 'off',

      // Phase 3 Enhancement Rules
      'corso/no-direct-process-env': 'error',
      'corso/require-zod-strict': 'error',
      'corso/require-runtime-exports': ['error', { files: ['app/api/**/*.ts'] }],
      'corso/no-direct-supabase-admin': 'error',
      'corso/no-deprecated-lib-imports': ['error', { configPath: './eslint-plugin-corso/rules/deprecated-imports.json' }],

      // New migrated rules from AST-Grep (Phase 1-3)
      'corso/force-root-imports': 'warn', // Start with warn due to potential false positives
      'corso/forbid-ui-self-barrel': 'error',
      'corso/no-underscore-dirs': 'error',
      'corso/no-widgets-from-outside': 'error',
      'corso/no-ad-hoc-navbars': 'warn',
      'corso/no-server-in-client': 'error',
      'corso/no-server-in-edge': 'error',
      'corso/forbid-security-barrel-in-client-or-edge': 'error',
      'corso/no-server-only-directive-in-shared': 'error',
      'corso/dashboard-import-guard': 'error',
      'corso/no-raw-internal-fetch': 'warn',
      'corso/ensure-api-wrappers': 'warn',
      'corso/next-script-no-empty-nonce': 'error',
      'corso/no-inline-color-literals': 'warn',
      'corso/no-server-only-in-client': 'error',
      'corso/no-edge-runtime-on-pages': 'error',

      // Disable core no-unused-vars for TypeScript files, use TypeScript version instead
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 'vars': 'all', 'args': 'after-used', 'ignoreRestSiblings': true, 'varsIgnorePattern': '^_', 'argsIgnorePattern': '^_', 'caughtErrorsIgnorePattern': '^_' }],

      // Unused exports prevention - unified across prod sources (warn first; escalate later)
      'import/no-unused-modules': ['warn', {
        missingExports: false,
        unusedExports: true,
        src: [
          'app/**/*.{ts,tsx}',
          'components/**/*.{ts,tsx}',
          'lib/**/*.{ts,tsx}',
        ],
        ignoreExports: [
          '**/index.ts',
          '**/*.test.{ts,tsx}',
          '**/__tests__/**/*',
          '**/__fixtures__/**/*',
          '**/tests/**/*',
          '**/*.test.tsx',
          'app/**/page.tsx',
          'app/**/layout.tsx',
          'app/**/route.ts',
          'app/**/error.tsx',
          'app/**/loading.tsx',
          'app/**/not-found.tsx',
          'app/**/providers.tsx',
          'app/**/*provider.tsx',
          'app/**/_theme.tsx',
          'app/**/actions.ts', // Server Actions are feature-colocated and used by page components
          // Shared utilities - factory functions used by route groups
          'app/shared/**/*.{ts,tsx}',
          'components/dashboard/entities/addresses/config.ts',
          // Formatters - used via named imports in aggrid adapter
          'lib/entities/adapters/aggrid-formatters.tsx',
          'components/dashboard/layout/dashboard-header.tsx',
          // UI components - exported via barrel and used via @/components
          'components/ui/segmented-control.tsx',
          // Entity configs - used internally via registry
          'components/dashboard/entities/companies/config.ts',
          'components/dashboard/entities/projects/config.ts',
          // Public API exports - legitimate unused exports
          'lib/api/**/*.ts',
          'lib/shared/**/*.ts',
          'lib/validators/**/*.ts',
          'lib/server/env.ts',
          // Infrastructure code - server-side utilities, middleware, integrations
          'lib/server/**/*.ts',
          'lib/middleware/**/*.ts',
          'lib/integrations/**/*.ts',
          'lib/ratelimiting/**/*.ts',
          'lib/monitoring/**/*.ts',
          'lib/security/**/*.ts',
          // Core utilities - public API types and error handling
          'lib/core/**/*.ts',
          // Vendor integration utilities - wrap external libraries, used as public API surfaces
          'lib/vendors/**/*.ts',
          // Note: actions/ directory was removed in PR5.2 - Server Actions are now feature-colocated
          // 'actions/**/*.ts', // Removed - Server Actions are feature-colocated
          // Note: hooks/ directory was removed - hooks are now domain-colocated (e.g., components/ui/hooks/, components/chat/hooks/)
          // Note: contexts/ directory was removed - providers are now in app/providers/
          // Entity services - used internally via registry
          'lib/entities/**/*.ts',
          // Marketing content services - server-side functions used in pages
          'lib/marketing/**/*.ts',
          // Mock utilities - used conditionally via dynamic imports
          'lib/mocks/**/*.ts',
          // Actions - server actions used in forms
          'lib/actions/**/*.ts',
          // Auth utilities - used in auth routes
          'lib/auth/**/*.ts',
          // Chat utilities - used in chat routes
          'lib/chat/**/*.ts',
          // Landing components - used via dynamic imports (next/dynamic, React.lazy)
          'components/landing/**/*.tsx',
          'components/landing/**/*.ts',
          // Insights components - used in insights pages/routes
          'components/insights/**/*.tsx',
          'components/insights/**/*.ts',
          // Chat components - used in chat routes/pages
          'components/chat/**/*.tsx',
          'components/chat/**/*.ts',
          // Forms components - used via dynamic imports
          'components/forms/**/*.tsx',
          'components/forms/**/*.ts',
          // Auth components - used in auth routes/layouts
          'components/auth/**/*.tsx',
          'components/auth/**/*.ts',
          // Dashboard components - used in dashboard routes
          'components/dashboard/**/*.tsx',
          'components/dashboard/**/*.ts',
          // UI icon components - exported via barrel and used in production
          'components/ui/atoms/icon/**/*.tsx',
          // UI atoms exported via barrel - used in production
          'components/ui/atoms/**/*.tsx',
          'components/ui/atoms/**/*.ts',
          // UI molecules with barrel exports
          'components/ui/molecules/**/*.tsx',
          'components/ui/molecules/**/*.ts',
          // Components used via dynamic imports
          'components/ui/organisms/**/*.tsx',
          'components/ui/organisms/**/*.ts',
          // Marketing components used via dynamic imports
          'components/marketing/**/*.tsx',
          'components/marketing/**/*.ts',
          // Billing components - used in subscription pages
          'components/billing/**/*.tsx',
          'components/billing/**/*.ts',
          // UI shared utilities - analytics, etc.
          'components/ui/shared/**/*.ts',
          // UI hooks - domain-colocated hooks used in UI components
          'components/ui/hooks/**/*.ts',
        ],
      }],

      // plugin-specific
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          types: ['function'],
          format: ['PascalCase'],
          filter: {
            regex: 'Schema$',
            match: true,
          },
        },
      ],
      'jsx-a11y/alt-text': 'warn',
      // jsdoc rules
      'jsdoc/require-jsdoc': [
        'warn',
        {
          require: {
            FunctionDeclaration: false,
            ClassDeclaration: false,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
          publicOnly: true,
        },
      ],
      // exports guard (ESLint v9 schema)
      'no-restricted-exports': ['error', { restrictedNamedExports: ['index.ts'] }],

      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React JSX key rules to prevent missing key warnings
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',

      // ⚠️ DEPENDENCY ARCHITECTURE ENFORCEMENT RULES ⚠️
      'no-restricted-imports': [
        'error',
        {
          'paths': [
            {
              'name': 'lib/monitoring',
              'message': 'Deprecated: import from "@/lib/monitoring" instead'
            }
          ],
          'patterns': [
            // Phase A: warn on legacy @shared/* alias to move to canonical @/shared/*
            {
              group: ['@shared/*'],
              message: 'Legacy alias @shared/* detected. Prefer canonical @/shared/*.',
            },
            {
              'group': ['@/lib/shared/guards', '@/lib/shared/guards/**'],
              'message': '⚠️  Deprecated: import from "@/lib/security/guards" instead.',
            },
            {
              'group': ['@/types/auth', '@/types/auth/index'],
              'message': 'Barrel removed. Import directly from canonical locations (e.g., @/types/auth/authorization/types).'
            },
            {
              'group': ['@/types/chat', '@/types/chat/index'],
              'message': 'Barrel discouraged. Prefer direct imports (e.g., @/types/chat/message/types).'
            },
            {
              'group': ['@/types/integrations', '@/types/integrations/index'],
              'message': 'Barrel discouraged. Prefer direct imports (e.g., @/types/integrations/supabase/core/types).'
            },
            {
              'group': ['@/types/dashboard/index'],
              'message': 'Barrel discouraged. Prefer direct imports (e.g., @/types/dashboard/analytics/types).'
            },
            {
              'group': ['@/lib/dashboard/entity'],
              'message': 'Use relative leaf imports within lib/dashboard/entity to avoid circular dependencies.'
            },
            {
              'group': ['@/lib/shared/constants/*'],
              'message': "Use the barrel '@/lib/shared/constants' instead of deep imports.",
            },
            {
              'group': [
                '@/lib/shared/cache/lru-cache',
                '@/lib/shared/cache/simple-cache',
              ],
              'message':
                "Policy A: import cache utilities from the root barrel '@/lib/shared' instead of deep file imports.",
            },
          ]
        }
      ],
    },
  },
  // Disallow importing from components/ui barrels outside components domain
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['components/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/ui', '@/components/ui/*'],
              message: 'Import from "@/components" instead of "@/components/ui".',
            },
            {
              group: ['@/components/atoms', '@/components/molecules', '@/components/organisms', '@/components/shared'],
              message: 'Import from "@/components" (root barrel) instead of deep component barrels.',
            },
          ],
        },
      ],
    },
  },
  // Allow components domain to import its own sub-barrels (override)
  {
    files: ['components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // Server code import restrictions (Radix UI, client components)
  {
    files: ['app/api/**/*.ts', 'lib/**/*.ts'],
    ignores: ['lib/shared/**', 'lib/validators/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@radix-ui/*'],
              message: 'Do not import Radix UI components in server-side code.',
            },
            {
              group: ['@/components/ui', '@/components/ui/*'],
              message: 'Do not import client UI components in server-side code.',
            },
          ],
        },
      ],
    },
  },
  // ClickHouse import restriction: ban globally, allow in integration tests
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['tests/integration/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@clickhouse/client',
              message: 'Use the integration layer for ClickHouse (do not import @clickhouse/client directly).',
            },
          ],
        },
      ],
    },
  },
  // Allow ClickHouse client in integration tests (override)
  {
    files: ['tests/integration/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  //---------------------------------------------------------------------------
  // UI deep-import relaxation: allow deeper imports within components/ui only
  // Keeps domain boundaries but disables barrel enforcement for this subtree
  //---------------------------------------------------------------------------
  {
    files: ['components/ui/**/*.{ts,tsx}'],
    rules: {
      // Keep boundaries on; deep-import check (barrel enforcement)
      'corso/no-cross-domain-imports': ['error', { configPath: './eslint-plugin-corso/rules/domain-config.json' }],
      'corso/no-deep-imports': ['error', { configPath: './eslint-plugin-corso/rules/domain-config.json' }],
      // UI layer must not import from Marketing (one-way dependency)
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/components/marketing', '@/components/marketing/**'],
              message: 'UI layer (atoms/molecules/organisms) must not import from Marketing.',
            },
          ],
        },
      ],
    },
  },
  // Accessibility: compound components false-positive (tablist definition)
  {
    files: ['components/ui/molecules/tabs/tab-list.tsx'],
    rules: {
      'jsx-a11y/aria-required-children': 'off',
    },
  },
  // Enforce types/ boundary - no runtime imports from lib/
  {
      files: ['types/**/*.ts', 'types/**/*.tsx'],
      rules: {
        '@typescript-eslint/no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@/lib',
                message: 'Runtime imports from @/lib are not allowed in types/. Use "import type" for types only.',
              },
            ],
            patterns: [
              {
                group: ['@/lib/*'],
                message: 'Runtime imports from @/lib/* are not allowed in types/. Use "import type" for types only.',
                allowTypeImports: true,
              },
            ],
          },
        ],
      },
    },
  {
    // Boundaries plugin enforcement
    /*
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          // UI component boundaries - allow access to lib and hooks
          { from: 'atoms', allow: ['atoms', 'lib', 'hooks'] },
          { from: 'molecules', allow: ['atoms', 'molecules', 'lib', 'hooks'] },
          { from: 'organisms', allow: ['atoms', 'molecules', 'organisms', 'lib', 'hooks', 'contexts-shared', 'contexts-auth', 'contexts-dashboard', 'contexts-organization'] },

          // Context boundaries
          { from: 'contexts-shared', allow: ['lib'] },
          { from: 'contexts-auth', allow: ['contexts-shared', 'lib'] },
          { from: 'contexts-dashboard', allow: ['contexts-shared', 'lib'] },
          { from: 'contexts-organization', allow: ['contexts-shared', 'lib'] },

          // Hooks can access lib and other hooks
          { from: 'hooks', allow: ['hooks', 'lib', 'contexts-*'] },

          // Tests can access everything for testing purposes
          { from: 'tests', allow: ['tests', 'lib', 'hooks', 'atoms', 'molecules', 'organisms'] },

          // Dependency architecture boundaries (strict within lib/)
          { from: 'lib-shared', allow: [] }, // shared can only import external packages
          { from: 'lib-core', allow: ['lib-integrations', 'lib-shared'] },
          { from: 'lib-integrations', allow: ['lib-core', 'lib-shared'] },
          { from: 'lib-analytics', allow: ['lib-core', 'lib-shared'] },
        ],
      },
    ],
    */
  },
  //---------------------------------------------------------------------------
  // 1a ) Action domain boundaries
  //---------------------------------------------------------------------------
  {
    // Note: actions/ directory was removed in PR5.2 - Server Actions are now feature-colocated
    // files: ['actions/**'], // Removed
    plugins: {
      // boundaries,  // TEMPORARY: Disabled for performance
      corso
    },
    rules: {
      'corso/enforce-action-validation': 'error',
      'corso/no-cross-domain-imports': ['error', { configPath: './eslint-plugin-corso/rules/domain-config.json', allowList: [] }],
      'corso/no-deep-imports': ['error', { configPath: './eslint-plugin-corso/rules/domain-config.json' }],
    },
  },
  //---------------------------------------------------------------------------
  // 1a.1 ) Realtime domain boundaries
  //---------------------------------------------------------------------------
  {
    files: ['lib/realtime/**/*.{ts,tsx}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      corso
    },
    rules: {
      // Realtime modules use channels, not Postgrest. Disable DB scoping rule here.
      'corso/require-supabase-scope': 'off',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/*', '!@/lib/core*', '!@/lib/integrations/supabase*'],
              importNames: ['*'],
              message:
                'Realtime module can only import from @/lib/core and @/lib/integrations/supabase. Move other dependencies to appropriate layers.',
              allowTypeImports: false,
            },
          ],
        },
      ],
    },
  },
  //---------------------------------------------------------------------------
  // 1b ) Test files with relaxed dependency rules
  //---------------------------------------------------------------------------
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser, parserOptions: tsParserOptions },
    plugins: {
      '@typescript-eslint': tsPlugin,
      // boundaries,  // TEMPORARY: Disabled for performance
      vitest,
      corso,
    },
    rules: {
      // Allow @/styles/ui barrel in test mocks (vitest.setup.shared.ts, etc.)
      // Tests need to mock the barrel for proper test isolation
      // Override: Tests are allowed to import/mock @/styles/ui for test setup
      // Production code should use domain barrels (atoms/molecules/organisms) or deep imports per policy
      // Note: This rule is merged with the deep relative import restrictions below
      'no-restricted-imports': [
        'error',
        {
          paths: [
            // Override: allow @/styles/ui in tests for mocking purposes
            // Production code should use domain barrels or deep imports per policy
          ],
          patterns: [
            // @/styles/ui is explicitly allowed in tests (not restricted here)
            // Forbid deep relative imports to app code from tests (prefer aliases like @/lib, @/components, @tests/support)
            {
              group: ['../../*', '../../../*', '../../../../*'],
              message: 'Use path aliases (e.g., @/lib, @/components, @tests/support) instead of deep relative imports.',
            },
            {
              group: ['../lib/*', '../../lib/*', '../components/*', '../../components/*', '../types/*', '../../types/*', '../hooks/*', '../../hooks/*'],
              message: 'Use project aliases instead of deep relative imports to app code.',
            },
          ],
        },
      ],
    },
    settings: {
      'import/resolver': {
        node: { extensions: ['.ts', '.tsx'] },
        typescript: { project: './tsconfig.json' },
      },
      // TEMPORARY: Disabled boundaries settings for performance
      /*
      'boundaries/elements': [
        { type: 'tests', pattern: 'tests/**' },
        { type: 'lib', pattern: 'lib/**' },
        { type: 'hooks', pattern: 'hooks/**' },
        { type: 'atoms', pattern: 'components/atoms/**' },
        { type: 'molecules', pattern: 'components/molecules/**' },
        { type: 'organisms', pattern: 'components/organisms/**' },
      ],
      */
    },
    rules: {
      // Disable core no-unused-vars for TypeScript files, use TypeScript version instead
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { 'vars': 'all', 'args': 'after-used', 'ignoreRestSiblings': true, 'varsIgnorePattern': '^_', 'argsIgnorePattern': '^_' }],
      // plugin-specific
      '@typescript-eslint/consistent-type-imports': 'warn',
      // '@typescript-eslint/no-floating-promises': 'error',  // TEMPORARY: Disabled for performance (requires type checking)

      // Relaxed boundaries for test files - tests can import from anywhere
      // 'boundaries/element-types': [
      //   'error',
      //   {
      //     default: 'allow', // Tests can access anything by default
      //     rules: [
      //       { from: 'tests', allow: ['tests', 'lib', 'hooks', 'atoms', 'molecules', 'organisms'] },
      //     ],
      //   },
      // ],

      // Vitest rules to enforce test quality
      'vitest/no-focused-tests': 'error',
      // 'corso/no-alias-imports-in-tests': 'error', // DISABLED: We now prefer alias imports for better maintainability

      // Note: no-restricted-imports is defined above to allow @/styles/ui for test mocks
      // and restrict deep relative imports

      // Prevent reintroduction of legacy tests/component path
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
             group: ['tests/component/*', 'tests/component/**'],
             message: 'tests/component/ is deprecated. Use tests/components/ (plural).',
            },
          ],
        },
      ],

      // Prevent random directories in tests root
      'corso/no-random-test-directories': 'error',
    },
  },
  // File-specific relaxations to keep lint passing while baseline is established
  {
    files: ['components/dashboard/table/ag-grid-container.tsx'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  {
    files: ['components/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-misused-promises': 'warn',
    },
  },
  {
    files: ['lib/validators/clerk-webhook.ts'],
    rules: {
      'corso/require-zod-strict': 'off',
    },
  },
  //---------------------------------------------------------------------------
  // 1c ) Types and Scripts with relaxed dependency rules (consistent with main codebase)
  //---------------------------------------------------------------------------
  {
    files: ['types/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: { parser: tsParser, parserOptions: tsParserOptions },
    plugins: {
      '@typescript-eslint': tsPlugin,
      corso,
    },
    rules: {
      // Ensure action-validation never runs in types/scripts
      'corso/enforce-action-validation': 'off',
      '@typescript-eslint/no-restricted-imports': 'off', // Relaxed to match main codebase preferences for deep imports
      'corso/no-root-lib-imports': 'off', // Allow barrel imports in scripts to match main codebase patterns
    },
  },
  //---------------------------------------------------------------------------
  // 1e ) Disable server-action validation in non-action UI/style code
  //---------------------------------------------------------------------------
  {
    files: ['styles/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    rules: {
      'corso/enforce-action-validation': 'off',
      'corso/no-raw-internal-fetch': 'off',
    },
  },
  //---------------------------------------------------------------------------
  // 1d ) Types directory with specialized rules
  //---------------------------------------------------------------------------
  {
    files: ['types/**/*.ts'],
    languageOptions: { parser: tsParser, parserOptions: tsParserOptions },
    plugins: {
      '@typescript-eslint': tsPlugin,
      corso,
    },
    rules: {
      // Extend types-specific rules from config
      'no-restricted-imports': [
        'error',
        {
          'patterns': [
            {
              'group': ['zod'],
              'message': 'Zod schemas should be defined in `lib/validators`, not in `types/`.',
            },
            {
              'group': ['types/*', '!types/*/*'],
              'message': 'Files are not allowed in the root of the `types` directory. Please move this file to a domain-specific subdirectory.'
            },
            {
              'group': ['types/*/*', '!**/*.types.ts', '!**/*.schema.ts', '!**/index.ts', '!**/*.md'],
              'message': 'Invalid file name. Only `.types.ts`, `.schema.ts`, `index.ts`, and `.md` files are allowed in `types` subdirectories.'
            },
            {
              'group': [
                'types/*',
                '!types/auth',
                '!types/dashboard',
                '!types/marketing',
                '!types/performance',
                '!types/security',
                '!types/shared',
                '!types/supabase',
                '!types/ui',
                '!types/zod'
              ],
              'message': 'Imports from unlisted subdirectories in `types/` are disallowed. Please update `types/.eslintrc.json` to add a new domain.'
            }
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          'selector': 'FunctionDeclaration',
          'message': 'No function declarations allowed in types/ directory - move runtime logic to lib/'
        },
        {
          'selector': 'FunctionExpression',
          'message': 'No function expressions allowed in types/ directory - move runtime logic to lib/'
        },
        {
          'selector': 'ClassDeclaration',
          'message': 'No class declarations allowed in types/ directory - use interfaces instead'
        }
      ],
      // Replacement rules for deprecated @typescript-eslint/ban-types
      '@typescript-eslint/no-unsafe-function-type': 'error', // Replaces Function ban
      '@typescript-eslint/no-empty-object-type': ['error', { 'allowInterfaces': 'with-single-extends' }], // Replaces {} ban
      '@typescript-eslint/no-wrapper-object-types': 'error', // Bans Number, String, Boolean wrapper types
      '@typescript-eslint/no-explicit-any': 'error', // Ban explicit any types
      'import/no-restricted-paths': [
        'error',
        {
          'zones': [
            {
              'target': './types',
              'from': ['./lib', './app', './components', './hooks'],
              'message': 'Cannot import runtime code from lib/app/components/actions/hooks into types/ - use type imports only'
            }
          ]
        }
      ],
      // Custom corso plugin rules
      'corso/legacy-shared-import': 'error',
      'corso/no-lib-imports-in-types': 'error',
      'no-restricted-imports': [
        'error',
        {
          name: 'react-error-boundary',
          message: 'Please import AppErrorBoundary from "@/components/ui/organisms" instead.',
        },
      ],
    },
  },
  //---------------------------------------------------------------------------
  // 2 ) Plain JavaScript files
  //---------------------------------------------------------------------------
  {
    files: ['**/*.js', '**/*.mjs'],
    ignores: ['node_modules/**'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      'no-console':
        process.env.NODE_ENV === 'production' ? ['warn', { allow: ['warn', 'error'] }] : 'off',
      'no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'no-duplicate-imports': 'error',
      eqeqeq: ['error', 'smart'],
      semi: ['error', 'always'],
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
  //---------------------------------------------------------------------------
  // 3 ) Tooling scripts & config files – loosened rules
  //---------------------------------------------------------------------------
  {
    files: ['*.config.{js,mjs,cjs}', 'next.config.mjs', 'scripts/**/*.js'],
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
    },
  },
  // 1a) Relax unused-vars in internal non-export modules (quick-win cleanup)
  {
    files: ['lib/**/*', 'scripts/**/*', 'styles/**/*'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  //---------------------------------------------------------------------------
  // 5 ) Overrides for specific files
  //---------------------------------------------------------------------------
  // Note: actions/ directory was removed in PR5.2 - Server Actions are now feature-colocated
  // This rule configuration is kept for reference but actions/index.ts no longer exists
  // Enforce http helper usage in API routes
  {
    files: ['app/api/**/route.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='NextResponse'][callee.property.name='json']",
          message: "Use http.* from '@/lib/api' instead of NextResponse.json.",
        },
      ],
      // Enforce Zod validation in route handlers
      'corso/enforce-action-validation': 'error',
      // Do not require "use server" in route handlers (Next routes are server by default)
      'corso/use-server-directive': 'off',
      // Temporarily disable wrapper enforcement to keep routes clean of warnings
      'corso/ensure-api-wrappers': 'off',
    },
  },
  //--------------------------------------------------------------------------
  // Enforce "use server" only within app/ where needed; disable in lib/ and scripts/
  //--------------------------------------------------------------------------
  {
    files: ['app/**/*.{ts,tsx}'],
    rules: {
      'corso/use-server-directive': 'error',
    },
  },
  {
    files: ['lib/**/*.{ts,tsx}', 'scripts/**/*.ts'],
    rules: {
      'corso/use-server-directive': 'off',
    },
  },
  // Disable server-only directive enforcement in lib/** to unblock server modules that declare it
  {
    files: ['lib/**/*.{ts,tsx}'],
    rules: {
      'corso/no-server-only-directive-in-shared': 'off',
    },
  },
  // Allow Node built-ins in scripts/tools; these run in Node context, not Edge
  {
    files: ['scripts/**/*.{ts,tsx}', 'tools/**/*.{ts,tsx}'],
    rules: {
      'corso/no-server-in-edge': 'off',
    },
  },
  // Silence wrapper enforcement within internal API libraries while we migrate
  {
    files: ['lib/api/**/*.{ts,tsx}'],
    rules: {
      'corso/ensure-api-wrappers': 'off',
    },
  },
  //---------------------------------------------------------------------------
  // 6 ) Next.js plugin (flat config) – enables core web vitals rules
  //---------------------------------------------------------------------------
  {
    files: ['app/**/*.{ts,tsx}', 'pages/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    plugins: {
      next: nextPlugin,
    },
    rules: {
      'next/no-img-element': 'error',
      'next/no-sync-scripts': 'error',
      'next/no-html-link-for-pages': 'off',
    },
  },
  // Guard: prevent server-only imports in edge-safe API barrel
  {
    files: ['lib/api/index.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@/lib/auth/server', message: 'Server-only. Do not import from edge-safe barrel lib/api/index.ts.' },
          ],
        },
      ],
    },
  },
  // Edge-only libraries must not import server-only code
  {
    files: [
      'lib/middleware/edge/**/*.{ts,tsx,js,jsx}',
      'lib/api/**/*.{ts,tsx,js,jsx}',
    ],
    ignores: ['lib/api/server/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/server/*', '@/lib/server/**', '@/lib/ratelimiting/server'],
              message: 'Server-only import in Edge-safe library. Move code under lib/api/server or refactor for Edge.'
            }
          ]
        }
      ]
    }
  },
  // Hardening: disallow next/headers and next/cookies imports in libraries only
  {
    files: ['lib/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next/headers', 'next/cookies'],
              message: 'Do not import next/headers or next/cookies in libraries. Use route handlers or actions to access them.'
            },
            {
              group: ['@/lib/dashboard/**'],
              message: 'lib/dashboard/** is deprecated. Use @/lib/entities/** instead.'
            },
            {
              group: ['@/lib/services', '@/lib/services/**'],
              message: 'lib/services/** is removed. Use @/lib/entities/** instead.'
            }
          ]
        }
      ],
    },
  },
  // Allow plain img tags for favicon.ico in sidebar components (avoids Next.js optimization issues with .ico files)
  {
    files: ['components/dashboard/layout/dashboard-sidebar-topbar.tsx', 'components/dashboard/layout/sidebar-top.tsx'],
    rules: {
      'next/no-img-element': 'off',
    },
  },
  // Silence import/no-unused-modules for framework-driven Next.js files
  {
    files: [
      'app/**/*/route.ts',
      'app/**/*/page.tsx',
      'app/**/*/layout.tsx',
      'app/**/*/error.tsx',
      'app/**/*/loading.tsx',
      'app/**/*/not-found.tsx',
      'app/**/*/sitemap.ts',
      'app/**/*/robots.ts',
      'app/**/*/opengraph-image.{ts,tsx}',
      'app/**/*/twitter-image.{ts,tsx}',
      'app/**/*/rss/**/route.ts',
      'app/**/*/_theme.tsx',
      'app/**/*/client.tsx',
      'app/**/*/scroll-to-faq.tsx',
      'app/global-error.tsx',
    ],
    rules: {
      // Next.js consumes these exports by convention; do not flag as unused.
      'import/no-unused-modules': 'off',
    },
  },
  // Silence import/no-unused-modules for Next.js special framework exports
  {
    files: [
      'app/**/{layout,not-found,global-error,template,error,loading}.tsx',
      'app/**/route.ts',
      'app/sitemap.ts',
      'app/robots.ts'
    ],
    rules: {
      'import/no-unused-modules': 'off'
    }
  },
  // Internal-only UI surface: allowed to bypass unused-exports noise.
  {
    files: ['**/_internal/**/*.{ts,tsx}'],
    rules: {
      'import/no-unused-modules': 'off',
    },
  },
  deprecatedInterRule,
  // Disallow importing server-only modules in client components only
  {
    files: ['components/**/*.{ts,tsx}'], // Only pure client components
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/lib/server/**'], message: 'Server-only code must not be imported in client components. Use server actions or API routes.' },
            { group: ['@/lib/**/server/**'], message: 'Server-only code must not be imported in client components. Use server actions or API routes.' }
          ]
        }
      ]
    }
  }
];
