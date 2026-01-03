#!/usr/bin/env tsx
/**
 * Validates that a single filename follows kebab-case naming convention.
 * 
 * Checks that filenames use lowercase letters, numbers, and hyphens only.
 * Dotfiles are ignored. Used by lint-staged for per-file validation.
 * 
 * Intent: Enforce kebab-case filename convention
 * Files: Single file path provided as argument
 * Invocation: tsx scripts/lint/check-filename-case.ts <file-path>
 */
import { getFilename } from './_utils';
import { logger } from './_utils';

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    logger.info('Usage: tsx scripts/lint/check-filename-case.ts <file-path>');
    process.exitCode = 1;
    return;
  }

  const filename = getFilename(filePath);

  // Ignore dotfiles
  if (filename.startsWith('.')) {
    return;
  }

  const kebab = /^(?:[a-z0-9]+-)*[a-z0-9]+(?:\.[^.]+)?$/;
  if (!kebab.test(filename)) {
    logger.error(`✖ Filename casing violation: ${filePath}`);
    process.exitCode = 1;
    return;
  }

  logger.success(`✅ Filename casing is correct for: ${filePath}`);
}

main(); 

