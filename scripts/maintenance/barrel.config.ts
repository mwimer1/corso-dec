export type BarrelDomainPolicy = {
  root: string;               // e.g., "lib/shared"
  internal: string[];         // globs to exclude from missing-export checks
  publicHints?: string[];     // optional globs to prefer as public candidates
};

export const LIB_POLICIES: BarrelDomainPolicy[] = [
  {
    root: 'lib/api',
    internal: [
      'lib/api/node/**',
      'lib/api/node.ts',
      'lib/api/server/**',
      'lib/api/streaming/**',
      'lib/api/response/**',
      'lib/api/billing/**',
      'lib/api/internal/**',
      'lib/api/auth.ts',
      'lib/api/env.ts',
      // generic server internals
      '**/*.server.ts',
      '**/server/**',
      '**/index-server.ts',
      'node*',
    ],
    publicHints: [
      'lib/api/auth-edge.ts',
      'lib/api/client.ts',
      'lib/api/edge.ts',
      'lib/api/redirect.ts',
      'lib/api/path.ts',
      'lib/api/response/http.ts',
      'lib/api/shared/**',
    ],
  },
  {
    root: 'lib/shared',
    internal: [
      'lib/shared/env/**',
      'lib/shared/env.ts',
      'lib/shared/**/__tests__/**',
      'lib/shared/**/__mocks__/**',
      'lib/shared/**/internal/**',
      '**/*.server.ts',
      '**/server/**',
      '**/index-server.ts',
      'env/**',
      'env.ts',
      'test/**',
      'internal/**',
    ],
    publicHints: [
      'lib/shared/analytics/**',
      'lib/shared/marketing/**',
      'lib/shared/table/**',
      'lib/shared/react-query/**',
      'lib/shared/errors/**',
      'lib/shared/validation/**',
    ],
  },
  {
    root: 'lib/validators',
    internal: [
      'lib/validators/**/__tests__/**',
      'lib/validators/**/internal/**',
    ],
  },
  {
    root: 'lib/chat',
    internal: [
      '**/*.server.ts',
      '**/server/**',
      '**/index-server.ts',
      'index-server.ts',
    ],
  },
  {
    root: 'lib/dashboard',
    internal: [
      '**/*.server.ts',
      '**/server/**',
      '**/index-server.ts',
    ],
  },
  {
    root: 'lib/integrations',
    internal: [
      '**/*.server.ts',
      '**/server/**',
      '**/index-server.ts',
      '(clickhouse)/**',
      '(supabase)/**',
    ],
  },
  {
    root: 'lib/monitoring',
    internal: [
      '**/*.server.ts',
      '**/server/**',
      '**/index-server.ts',
      '**/(pipeline|sentry|utils)/**',
    ],
  },
  {
    root: 'lib/mocks',
    internal: ['**/*'],
  },
];



