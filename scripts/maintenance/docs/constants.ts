/**
 * @fileoverview Constants for docs maintenance tools
 * @description Shared constants and configuration defaults
 */

export const DEFAULT_GLOB_PATTERNS = [
  'README.md',
  'docs/**/*.md',
  'actions/**/README.md',
  'app/**/README.md',
  'lib/**/README.md',
  'types/**/README.md',
  'hooks/**/README.md',
  'components/**/README.md',
  'contexts/**/README.md',
  'styles/**/README.md',
  'scripts/**/README.md',
  'tests/**/README.md',
  'tools/**/README.md',
  'supabase/**/README.md',
  'config/**/README.md',
  'public/**/README.md',
  'eslint-plugin-corso/**/README.md',
  '.husky/**/README.md',
  '.github/**/README.md',
  '.vscode/**/README.md',
  '.cursor/**/README.md',
] as const;

export const EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/reports/**',
  '**/.next/**',
] as const;

export const FRONTMATTER_DEFAULTS = {
  category: 'documentation',
  status: 'draft',
} as const;

export const LINK_FIX_PATTERNS = [
  {
    pattern: '../development-workflow.md',
    replacement: '../dev-environment.md',
    description: 'dev workflow -> dev environment'
  },
  {
    pattern: '../quality-gates.md',
    replacement: '../ci/quality-gates.md',
    description: 'quality-gates -> ci/quality-gates'
  },
  {
    pattern: '../codebase/scripts.md',
    replacement: '../scripts-vs-tools-guidelines.md',
    description: 'scripts -> scripts-vs-tools-guidelines'
  },
  {
    pattern: '../codebase/tools.md',
    replacement: '../scripts-vs-tools-guidelines.md',
    description: 'tools -> scripts-vs-tools-guidelines'
  },
] as const;

export const MARKDOWN_TRANSFORM_MARKERS = {
  exportsTable: '<!-- EXPORTS_TABLE -->',
  docsIndex: '<!-- DOCS_INDEX -->',
  toc: '<!-- TOC -->',
} as const;

export const EXIT_CODES = {
  SUCCESS: 0,
  VALIDATION_ERROR: 1,
  CONFIG_ERROR: 2,
  IO_ERROR: 3,
} as const;

