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
import { execFileSync, spawnSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve, dirname } from 'path';

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

function getRepoRoot(): string {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
    }).trim();
  } catch {
    // Fallback to current working directory
    return process.cwd();
  }
}

function typecheckFiles(files: string[]): boolean {
  if (files.length === 0) {
    logger.info('✅ No staged TypeScript files to typecheck');
    return true;
  }

  logger.info(`🔍 Typechecking ${files.length} staged TypeScript file(s)...`);

  try {
    const repoRoot = getRepoRoot();
    const cacheDir = join(repoRoot, '.cache', 'tsc');
    
    // Ensure cache directory exists
    mkdirSync(cacheDir, { recursive: true });

    // Read base tsconfig.json
    const baseTsconfigPath = join(repoRoot, 'tsconfig.json');
    const baseTsconfig = JSON.parse(readFileSync(baseTsconfigPath, 'utf8'));

    // Convert file paths to relative paths from repo root
    // TypeScript works better with relative paths in the files array
    const relativeFiles = files.map((file) => {
      // If file is already absolute, make it relative to repo root
      if (file.startsWith('/') || /^[A-Z]:/.test(file)) {
        return file.replace(repoRoot + '/', '').replace(repoRoot + '\\', '').replace(/\\/g, '/');
      }
      // Already relative, use as-is
      return file.replace(/\\/g, '/');
    });

    // Create temporary tsconfig for staged files only
    // extends path must be relative to temp config location (.cache/tsc/)
    // From .cache/tsc/ we need to go up two levels (../../) to reach repo root
    let extendsPath: string;
    if (baseTsconfig.extends) {
      // If extends is already relative, make it relative to temp config location
      if (baseTsconfig.extends.startsWith('.')) {
        // Remove leading ./ if present, then prepend ../../ to go from .cache/tsc/ to repo root
        const cleanExtends = baseTsconfig.extends.replace(/^\.\//, '');
        extendsPath = `../../${cleanExtends}`;
      } else {
        // Absolute or package path - use as-is (TypeScript will resolve)
        extendsPath = baseTsconfig.extends;
      }
    } else {
      // Default: extend root tsconfig.json
      extendsPath = '../../tsconfig.json';
    }
    
    const tempTsconfig = {
      extends: extendsPath,
      compilerOptions: {
        ...baseTsconfig.compilerOptions,
        noEmit: true,
        incremental: true,
        tsBuildInfoFile: 'staged.tsbuildinfo', // Relative to temp config location
      },
      files: relativeFiles,
      include: [], // Explicitly empty to only check files array
      exclude: [], // Explicitly empty
    };

    const tempTsconfigPath = join(cacheDir, 'tsconfig.staged.json');
    writeFileSync(tempTsconfigPath, JSON.stringify(tempTsconfig, null, 2), 'utf8');

    // Run tsc with the temporary config
    // Use pnpm exec to find tsc in node_modules
    // Use spawnSync for better error handling on Windows
    const result = spawnSync(
      'pnpm',
      [
        'exec',
        'tsc',
        '--project',
        tempTsconfigPath,
        '--pretty',
        'false',
      ],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'inherit',
      }
    );

    if (result.status !== 0) {
      throw new Error(`TypeScript compilation failed with exit code ${result.status}`);
    }

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

// Always run main when script is invoked
main();
