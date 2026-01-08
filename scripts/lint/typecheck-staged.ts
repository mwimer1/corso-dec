#!/usr/bin/env tsx
/**
 * Typechecks only staged TypeScript files for faster pre-commit hooks.
 * 
 * Runs TypeScript compiler on only the staged .ts/.tsx files instead of the entire
 * codebase, providing faster feedback during development while maintaining type safety.
 * 
 * Intent: Fast type checking for staged files only
 * Files: Git staged .ts/.tsx files
 * Invocation: pnpm typecheck:staged (via pre-commit hook)
 */
import { execFileSync } from 'child_process';
import { existsSync } from 'fs';

const logger = {
  info: (...a: unknown[]) => console.log('[info]', ...a),
  warn: (...a: unknown[]) => console.warn('[warn]', ...a),
  error: (...a: unknown[]) => console.error('[error]', ...a),
  success: (...a: unknown[]) => console.log('[success]', ...a),
};

function getStagedFiles(): string[] {
  try {
    // Get staged files (--cached = staged files)
    const output = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMR'], {
      encoding: 'utf8',
    });

    const files = output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => existsSync(file)); // Only include files that exist

    return files;
  } catch (error) {
    logger.error('Failed to get staged files:', error);
    throw error;
  }
}

function typecheckFiles(files: string[]): boolean {
  if (files.length === 0) {
    logger.info('✅ No staged TypeScript files to typecheck');
    return true;
  }

  logger.info(`🔍 Typechecking ${files.length} staged TypeScript file(s)...`);

  try {
    // Use tsc to check specific files
    // When files are passed as arguments to tsc, it checks only those files
    // (plus their transitive dependencies for type resolution)
    // With incremental compilation enabled, this is much faster than full typecheck
    execFileSync(
      'tsc',
      [
        '--noEmit',
        '--project',
        'tsconfig.json',
        // Pass files as arguments - TypeScript checks only these files
        // Note: TypeScript still resolves imports but only checks the specified files
        ...files,
      ],
      {
        stdio: 'inherit',
        encoding: 'utf8',
      }
    );

    logger.success(`✅ Typecheck passed for ${files.length} staged file(s)`);
    return true;
  } catch (error) {
    logger.error(`❌ Typecheck failed for staged files`);
    // Error details are already printed via stdio: 'inherit'
    return false;
  }
}

function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    logger.info('✅ No staged TypeScript files, skipping typecheck');
    process.exit(0);
  }

  const success = typecheckFiles(stagedFiles);
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
