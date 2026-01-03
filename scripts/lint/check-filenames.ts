#!/usr/bin/env tsx
/**
 * Batch filename case validation for all repository files.
 * 
 * Scans all files in the repository and validates they follow kebab-case naming
 * convention (lowercase letters, numbers, hyphens only). Dotfiles are ignored.
 * More efficient than per-file validation for full repository scans.
 * 
 * Intent: Enforce kebab-case filename convention across repository
 * Files: All files in repository (excluding ignored directories)
 * Invocation: pnpm lint (via prelint hook)
 */
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
