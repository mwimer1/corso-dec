#!/usr/bin/env tsx
/**
 * Target Builder
 *
 * Builds TargetSet from CLI options and git state.
 * Handles changed file detection and filtering.
 */

import { spawnSync } from 'child_process';
import { glob } from 'glob';
import { normalize } from 'node:path';
import type { TargetSet } from './types';
import { getRepoRoot, normalizePath, getRelativePath } from '../lint/_utils/paths';

export interface TargetBuilderOptions {
  rootDir: string;
  changed: boolean;
  since?: string;
  include?: string[];
  exclude?: string[];
}

/**
 * Get changed files from git using merge-base semantics
 * 
 * Uses triple-dot syntax (since...HEAD) which automatically computes merge-base
 * for branch comparisons. Falls back to direct diff if triple-dot fails.
 * 
 * Returns an object that distinguishes between:
 * - Success with no changes: { ok: true, files: [], method: 'triple-dot' }
 * - Success with changes: { ok: true, files: [...], method: 'triple-dot' }
 * - Failure: { ok: false, files: [], method?: undefined }
 * 
 * @internal Exported for testing only
 */
export function getChangedFiles(
  rootDir: string,
  since: string
): { ok: boolean; files: string[]; method?: 'triple-dot' | 'direct' } {
  // Attempt A: Use triple-dot syntax (preferred - uses merge-base automatically)
  const tripleDotResult = spawnSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', `${since}...HEAD`],
    {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  if (tripleDotResult.status === 0) {
    const output = tripleDotResult.stdout.trim();
    const files = output
      ? output
          .split('\n')
          .map(file => normalizePath(file.trim()))
          .filter(Boolean)
      : [];
    return { ok: true, files, method: 'triple-dot' };
  }

  // Attempt B: Fallback to direct diff (if triple-dot fails, e.g., invalid ref)
  const directResult = spawnSync(
    'git',
    ['diff', '--name-only', '--diff-filter=ACMR', since, 'HEAD'],
    {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  if (directResult.status === 0) {
    const output = directResult.stdout.trim();
    const files = output
      ? output
          .split('\n')
          .map(file => normalizePath(file.trim()))
          .filter(Boolean)
      : [];
    return { ok: true, files, method: 'direct' };
  }

  // Both attempts failed
  return { ok: false, files: [] };
}

/**
 * Filter files by include/exclude patterns
 */
function filterFiles(
  files: string[],
  include?: string[],
  exclude?: string[]
): string[] {
  let filtered = [...files];

  // Apply includes
  if (include && include.length > 0) {
    filtered = filtered.filter(file => {
      return include.some(pattern => {
        // Simple glob-like pattern matching
        const regex = new RegExp(
          pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\./g, '\\.')
        );
        return regex.test(file);
      });
    });
  }

  // Apply excludes
  if (exclude && exclude.length > 0) {
    filtered = filtered.filter(file => {
      return !exclude.some(pattern => {
        const regex = new RegExp(
          pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\./g, '\\.')
        );
        return regex.test(file);
      });
    });
  }

  return filtered;
}

/**
 * Get all files matching patterns
 */
async function getAllFiles(
  rootDir: string,
  patterns: string[],
  include?: string[],
  exclude?: string[]
): Promise<string[]> {
  const files: string[] = [];

  for (const pattern of patterns) {
    try {
      const matches = await glob(pattern, {
        cwd: rootDir,
        absolute: false,
        nodir: true,
        ignore: [
          '**/node_modules/**',
          '**/.next/**',
          '**/build/**',
          '**/dist/**',
        ],
      });

      for (const match of matches) {
        files.push(normalizePath(match));
      }
    } catch {
      // Skip patterns that fail
    }
  }

  return filterFiles([...new Set(files)], include, exclude);
}

/**
 * Build TargetSet from options
 */
export async function buildTargetSet(
  options: TargetBuilderOptions
): Promise<TargetSet> {
  const { rootDir, changed, since = 'HEAD~1', include, exclude } = options;

  // Get changed files (always computed for index building, but critical in changed mode)
  const changedResult = getChangedFiles(rootDir, since);
  
  // Determine effective mode: if changed mode requested but detection failed, fall back to full
  let effectiveChanged = changed;
  let allChangedFiles: string[] = [];

  if (changed) {
    if (!changedResult.ok) {
      // Changed detection failed - warn and fall back to full mode
      console.warn(
        `⚠️  Warning: Changed file detection failed (git diff ${since}...HEAD). Falling back to full scan.`
      );
      effectiveChanged = false;
    } else {
      allChangedFiles = changedResult.files;
    }
  } else {
    // In full mode, failure is non-fatal - proceed with empty changed files list
    if (changedResult.ok) {
      allChangedFiles = changedResult.files;
    }
    // If it failed, allChangedFiles remains [] which is fine for full mode
  }

  // Filter changed files
  const changedFiles = filterFiles(allChangedFiles, include, exclude);

  // Get all files by type (in full mode) or only changed files (in changed mode)
  const filePatterns = effectiveChanged
    ? changedFiles
    : await getAllFiles(rootDir, ['**/*'], include, exclude);

  const cssFiles = filePatterns.filter(f => f.endsWith('.css') && !f.endsWith('.module.css'));
  const cssModuleFiles = filePatterns.filter(f => f.endsWith('.module.css'));
  const tsFiles = filePatterns.filter(f => f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.d.ts'));
  // Fix: exclude .d.ts files from tsxFiles (they match .ts but shouldn't be included)
  const tsxFiles = filePatterns.filter(
    f => (f.endsWith('.tsx') || f.endsWith('.ts')) && !f.endsWith('.d.ts')
  );

  // In changed mode, we still want all CSS modules available for index building
  const allCssModuleFiles = effectiveChanged
    ? await getAllFiles(rootDir, ['**/*.module.css'], include, exclude)
    : cssModuleFiles;

  const result: TargetSet = {
    mode: effectiveChanged ? 'changed' : 'full',
    changedFiles,
    cssFiles,
    cssModuleFiles: allCssModuleFiles,
    tsFiles,
    tsxFiles,
    allFiles: filePatterns,
  };

  if (effectiveChanged && since) {
    result.sinceRef = since;
  }

  return result;
}
