#!/usr/bin/env tsx
// scripts/lint/should-skip-check.ts
// Helper to determine if a validation check should be skipped based on staged files

import { hasStagedFiles } from './_utils/cache';

/**
 * Check if a validation should be skipped based on what files are staged
 */
export function shouldSkipPackageValidation(): boolean {
  // Skip if package.json is not staged
  return !hasStagedFiles(['package.json']);
}

export function shouldSkipEnvValidation(): boolean {
  // Skip env validation if no config files that might affect environment are staged
  // Note: .env files are gitignored, so we check config files instead
  const configFiles = [
    'package.json',
    'next.config.mjs',
    'next.config.js',
    'tsconfig.json',
    '.env.example',
    '.env.test',
  ];
  
  // Also check for any env-related scripts or config changes
  return !hasStagedFiles([
    ...configFiles,
    /\.env\..*/, // Any .env.* file (even if gitignored, pattern check)
    /config\/.*env.*/, // Config files with 'env' in path
  ]);
}

/**
 * Check if we should skip a check entirely (used in pre-commit hook)
 */
export function checkIfShouldSkip(
  checkName: 'package' | 'env',
  alwaysRun = false
): boolean {
  if (alwaysRun) {
    return false; // Force run (e.g., for CI)
  }

  switch (checkName) {
    case 'package':
      return shouldSkipPackageValidation();
    case 'env':
      return shouldSkipEnvValidation();
    default:
      return false;
  }
}
