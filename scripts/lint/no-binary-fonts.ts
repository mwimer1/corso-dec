#!/usr/bin/env tsx
// scripts/lint/no-binary-fonts.ts
// CI guardrail to prevent binary fonts from being committed

import { globby } from 'globby';
import { readTextSync } from '../utils/fs/read';
import { logger } from '../utils/logger';

const BINARY_FONT_PATTERNS: string[] = [
  '**/*.woff',
  '**/*.woff2',
  '**/*.ttf',
  '**/*.otf',
  '**/*.eot',
];

const IGNORE_PATTERNS: string[] = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  '.git/**',
  'scripts/lint/no-binary-fonts.ts', // Don't check our own validation script
];

async function checkForBinaryFonts(): Promise<boolean> {
  logger.info('🔍 Checking for binary font files...');

  try {
    const offenders = await globby(BINARY_FONT_PATTERNS, { ignore: IGNORE_PATTERNS, absolute: true });

    if (offenders.length > 0) {
      logger.error('❌ Binary font files detected:');
      offenders.forEach((file: string) => {
        logger.error(`  - ${file}`);
      });

      logger.error('\n💡 Solution:');
      logger.error('  Instead of committing binary fonts, use one of these approaches:');
      logger.error('  1. Google Fonts CDN: import { Lato } from "next/font/google"');
      logger.error('  2. Self-hosted npm: pnpm add @fontsource-variable/lato');
      logger.error('  3. See docs/fonts-offline-build.md for offline builds');

      process.exitCode = 1;
      return false;
    }

    logger.success('✅ No binary font files found - using next/font is the way!');
    return true;
  } catch (error) {
    logger.error('❌ Error checking for binary fonts:', error);
    process.exitCode = 1;
    return false;
  }
}

async function checkForLocalFontImports(): Promise<boolean> {
  logger.info('🔍 Checking for local font imports...');

  try {
    const jsFiles = await globby(['**/*.{js,jsx,ts,tsx}'], { ignore: IGNORE_PATTERNS });

    const problematicFiles: { file: string; issue: string }[] = [];

    for (const file of jsFiles) {
      const content = readTextSync(file);

      const localFontImports: RegExp[] = [
        /import.*from.*['"]\.\/(public\/)?fonts?.*['"]/g,
        /import.*localFont.*from.*['"]next\/font\/local['"]/g,
        /url\(['"]\.\.?\/.*\.(woff2?|ttf|otf|eot)['"]?\)/g,
      ];

      for (const pattern of localFontImports) {
        if (pattern.test(content)) {
          problematicFiles.push({
            file,
            issue: 'Local font import detected',
          });
          break;
        }
      }
    }

    if (problematicFiles.length > 0) {
      logger.warn('⚠️  Local font imports detected:');
      problematicFiles.forEach(({ file, issue }) => {
        logger.warn(`  - ${file}: ${issue}`);
      });
      logger.warn('\n💡 Consider using next/font/google or @fontsource packages instead');
    }

    return true;
  } catch (error) {
    logger.error('❌ Error checking for local font imports:', error);
    return false;
  }
}

async function main() {
  const fontCheck = await checkForBinaryFonts();
  const importCheck = await checkForLocalFontImports();

  if (fontCheck && importCheck) {
    logger.success('✅ Font guardrails passed!');
  }
}

main().catch((error) => {
    logger.error('❌ Font guardrail check failed:', error);
    process.exitCode = 1;
});

