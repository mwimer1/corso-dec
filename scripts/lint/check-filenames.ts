#!/usr/bin/env tsx
// scripts/lint/check-filenames.ts
// Batch filename case checking (single-process, replaces per-file spawns)

import { findFiles, getFilename } from './_utils';
import { logger, createLintResult } from './_utils';

function checkFilenameCase(filePath: string): { valid: boolean; error?: string } {
  const filename = getFilename(filePath);

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
  const files = findFiles('**/*.*', {
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

  const result = createLintResult();

  // Check all files in a single process
  for (const file of files) {
    const checkResult = checkFilenameCase(file);
    if (!checkResult.valid) {
      result.addError(checkResult.error!);
    }
  }

  // Report results (preserves existing output format)
  result.report({
    successMessage: `✅ Filename casing is correct for all ${files.length} files`,
    errorPrefix: '❌',
  });
}

main();
