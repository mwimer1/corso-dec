#!/usr/bin/env tsx
/**
 * Prevents binary font files from being committed to the repository.
 * 
 * Scans for binary font files (.woff, .woff2, .ttf, .otf, .eot) and fails if any
 * are found. Fonts should be served from CDN or external sources, not committed.
 * 
 * Intent: Prevent binary font files in repository
 * Files: Binary font files (woff, woff2, ttf, otf, eot)
 * Invocation: 
 *   - pnpm validate:fonts (full repo scan)
 *   - lint-staged (checks only provided files)
 * 
 * CLI Args:
 *   --all: Enable repo-wide glob scans (default when no file args)
 *   --check-imports: Enable local font import scan (opt-in for hooks)
 *   <files...>: Check only these files (lint-staged mode)
 */
import { existsSync } from 'fs';
import { findFiles } from './_utils';
import { readTextSync } from '../utils/fs/read';
import { logger, createLintResult } from './_utils';

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

const FONT_EXTENSIONS = /\.(woff|woff2|ttf|otf|eot)$/i;

function checkForBinaryFonts(filesToCheck: string[] | null): boolean {
  logger.info('🔍 Checking for binary font files...');
  const result = createLintResult();

  try {
    let offenders: string[];

    if (filesToCheck !== null) {
      // Lint-staged mode: only check provided files
      offenders = filesToCheck.filter((file) => {
        if (!existsSync(file)) {
          return false;
        }
        return FONT_EXTENSIONS.test(file);
      });
    } else {
      // Repo-wide scan mode
      offenders = findFiles(BINARY_FONT_PATTERNS, { ignore: IGNORE_PATTERNS });
    }

    if (offenders.length > 0) {
      for (const file of offenders) {
        result.addError(file);
      }
    }

    // Preserve original output format
    if (result.hasErrors()) {
      logger.error('❌ Binary font files detected:');
      for (const error of result.getErrors()) {
        logger.error(`  - ${error}`);
      }

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

function checkForLocalFontImports(filesToCheck: string[] | null): boolean {
  logger.info('🔍 Checking for local font imports...');

  try {
    let jsFiles: string[];

    if (filesToCheck !== null) {
      // Lint-staged mode: only check provided files
      jsFiles = filesToCheck.filter((file) => {
        if (!existsSync(file)) {
          return false;
        }
        return /\.(js|jsx|ts|tsx)$/i.test(file);
      });
    } else {
      // Repo-wide scan mode
      jsFiles = findFiles(['**/*.{js,jsx,ts,tsx}'], { ignore: IGNORE_PATTERNS });
    }

    const problematicFiles: { file: string; issue: string }[] = [];

    for (const file of jsFiles) {
      try {
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
      } catch {
        // Skip files that can't be read
        continue;
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
  const args = process.argv.slice(2);
  const hasAllFlag = args.includes('--all');
  const hasCheckImportsFlag = args.includes('--check-imports');
  
  // Extract file arguments (non-flag args)
  const fileArgs = args.filter((arg) => !arg.startsWith('--'));

  // Determine mode:
  // - If file args exist: lint-staged mode (check only those files)
  // - If --all flag: repo-wide scan mode
  // - Otherwise: default to repo-wide scan (backward compatibility)
  const filesToCheck = fileArgs.length > 0 ? fileArgs : (hasAllFlag ? null : null);

  const fontCheck = checkForBinaryFonts(filesToCheck);
  
  // Only check imports if explicitly requested (opt-in for hooks)
  let importCheck = true;
  if (hasCheckImportsFlag) {
    importCheck = checkForLocalFontImports(filesToCheck);
  }

  if (fontCheck && importCheck) {
    logger.success('✅ Font guardrails passed!');
  } else {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  logger.error('❌ Font guardrail check failed:', error);
  process.exitCode = 1;
});

