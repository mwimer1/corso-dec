#!/usr/bin/env tsx
// scripts/lint/check-filename-case.ts

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

