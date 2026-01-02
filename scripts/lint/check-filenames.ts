#!/usr/bin/env tsx
// scripts/lint/check-filenames.ts
// Batch filename case checking (single-process, replaces per-file spawns)

import { globbySync } from 'globby';
import { basename } from 'path';
import { logger } from '../utils/logger';

function checkFilenameCase(filePath: string): { valid: boolean; error?: string } {
  const filename = basename(filePath);

  // Ignore dotfiles
  if (filename.startsWith('.')) {
    return { valid: true };
  }

  // Kebab-case pattern: lowercase letters, numbers, hyphens only
  const kebab = /^(?:[a-z0-9]+-)*[a-z0-9]+(?:\.[^.]+)?$/;
  if (!kebab.test(filename)) {
    return { valid: false, error: `Filename casing violation: ${filePath}` };
  }

  return { valid: true };
}

function main() {
  logger.info('Checking filename casing...');

  // Get all files (excluding ignored directories)
  const files = globbySync('**/*.*', {
    ignore: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.git/**',
      '**/.cache/**',
      '**/coverage/**',
      '**/reports/**',
      '**/test-results/**',
      '**/test-reports/**',
    ],
  });

  const violations: string[] = [];

  // Check all files in a single process
  for (const file of files) {
    const result = checkFilenameCase(file);
    if (!result.valid) {
      violations.push(result.error!);
    }
  }

  // Report results
  if (violations.length > 0) {
    logger.error(`❌ Found ${violations.length} filename casing violation(s):`);
    for (const violation of violations) {
      logger.error(`  ${violation}`);
    }
    process.exitCode = 1;
    return;
  }

  logger.success(`✅ Filename casing is correct for all ${files.length} files`);
}

main();
