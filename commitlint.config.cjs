module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New features
        'fix', // Bug fixes
        'docs', // Documentation changes
        'style', // Formatting, missing semi colons, etc; no code change
        'refactor', // Refactoring production code
        'test', // Adding missing tests, refactoring tests; no production code change
        'chore', // Updating grunt tasks etc; no production code change
        'perf', // Performance improvement
        'ci', // CI/CD related changes
        'build', // Build system or external dependencies
        'revert', // Reverting previous commits
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'dashboard',
        'chat',
        'components',
        'hooks',
        'api',
        'types',
        'stripe',
        'openai',
        'supabase',
        'clickhouse',
        'build',
        'config',
        'styles',
        'docs',
        'tests',
        'infrastructure',
        'subscription',
        'organization',
        'deps',
        'db',
        'security',
      ],
    ],
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [0], // Disabled - no character limit on body lines
    'footer-max-line-length': [2, 'always', 72],
  },
};


