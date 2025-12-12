#!/usr/bin/env tsx
// scripts/lint/check-css-paths.ts

import { execSync } from 'child_process';
import { logger } from '../utils/logger';

function main() {
  try {
    const result = execSync("rg --files -tcss --glob '!styles/**/*' .", {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    if (result) {
      logger.error('❌ CSS files found outside styles/ directory:');
      logger.error(result);
      process.exit(1);
    }

    logger.success('✅ No stray CSS files found.');
  } catch (error: any) {
    if (error.status === 1) {
      logger.success('✅ No stray CSS files found.');
      process.exit(0);
    }
    logger.error('❌ Error running ripgrep:', error);
    process.exit(1);
  }
}

main();

