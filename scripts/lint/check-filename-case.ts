#!/usr/bin/env tsx
// scripts/lint/check-filename-case.ts

import { basename } from 'path';
import { logger } from '../utils/logger';

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    logger.info('Usage: tsx scripts/lint/check-filename-case.ts <file-path>');
    process.exit(1);
  }

  const filename = basename(filePath);

  // Ignore dotfiles
  if (filename.startsWith('.')) {
    process.exit(0);
  }

  const kebab = /^(?:[a-z0-9]+-)*[a-z0-9]+(?:\.[^.]+)?$/;
  if (!kebab.test(filename)) {
    logger.error(`✖ Filename casing violation: ${filePath}`);
    process.exit(1);
  }

  logger.success(`✅ Filename casing is correct for: ${filePath}`);
}

main(); 

