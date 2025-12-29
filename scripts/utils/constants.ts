/**
 * Common ignore patterns used across file scanning scripts
 * Single source of truth for directory/file exclusions
 */
export const COMMON_IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  'test-reports',
  'test-results',
  '.cache',
  '.turbo',
] as const;

export const COMMON_IGNORE_GLOBS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.next/**',
  '**/test-reports/**',
  '**/test-results/**',
  '**/.cache/**',
  '**/.turbo/**',
] as const;

/**
 * Common file extensions to include in scans
 */
export const COMMON_FILE_EXTENSIONS = {
  typescript: ['.ts', '.tsx', '.mts'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  markdown: ['.md', '.mdx'],
  config: ['.json', '.yml', '.yaml'],
} as const;

