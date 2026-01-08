#!/usr/bin/env tsx
/**
 * Target Builder
 *
 * Builds TargetSet from CLI options and git state.
 * Handles changed file detection and filtering.
 */

import { execFileSync } from 'child_process';
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
 * Execute git command using execFileSync for security (avoids shell injection)
 */
function git(rootDir: string, args: string[]): string {
  try {
    return execFileSync('git', args, {
      cwd: rootDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * Try to get merge-base commit between since and HEAD
 * Returns null if merge-base cannot be computed (e.g., not a branch, invalid ref)
 */
function tryMergeBase(rootDir: string, since: string): string | null {
  try {
    const mb = git(rootDir, ['merge-base', since, 'HEAD']);
    return mb || null;
  } catch {
    return null;
  }
}

/**
 * Get changed files from git
 * 
 * For branch comparisons (e.g., --since main), computes the merge-base
 * to correctly identify files changed only on the current branch.
 * 
 * This prevents false positives when comparing against a branch that has
 * diverged (e.g., main has new commits after your branch was cut).
 * 
 * @internal Exported for testing only
 */
export function getChangedFiles(rootDir: string, since: string): string[] {
  try {
    // Try to find merge-base first (works for branch comparisons)
    const baseRef = tryMergeBase(rootDir, since) ?? since;

    const output = git(rootDir, [
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      baseRef,
      'HEAD',
    ]);

    if (!output) {
      return [];
    }

    return output
      .split('\n')
      .map(file => normalizePath(file.trim()))
      .filter(Boolean);
  } catch {
    // If git command fails (e.g., not a git repo), return empty
    return [];
  }
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

  let allChangedFiles: string[] = [];

  if (changed) {
    allChangedFiles = getChangedFiles(rootDir, since);
  } else {
    // In full mode, we still need to know what changed for index building
    allChangedFiles = getChangedFiles(rootDir, since);
  }

  // Filter changed files
  const changedFiles = filterFiles(allChangedFiles, include, exclude);

  // Get all files by type (in full mode) or only changed files (in changed mode)
  const filePatterns = changed
    ? changedFiles
    : await getAllFiles(rootDir, ['**/*'], include, exclude);

  const cssFiles = filePatterns.filter(f => f.endsWith('.css') && !f.endsWith('.module.css'));
  const cssModuleFiles = filePatterns.filter(f => f.endsWith('.module.css'));
  const tsFiles = filePatterns.filter(f => f.endsWith('.ts') && !f.endsWith('.tsx') && !f.endsWith('.d.ts'));
  const tsxFiles = filePatterns.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  // In changed mode, we still want all CSS modules available for index building
  const allCssModuleFiles = changed
    ? await getAllFiles(rootDir, ['**/*.module.css'], include, exclude)
    : cssModuleFiles;

  const result: TargetSet = {
    mode: changed ? 'changed' : 'full',
    changedFiles,
    cssFiles,
    cssModuleFiles: allCssModuleFiles,
    tsFiles,
    tsxFiles,
    allFiles: filePatterns,
  };

  if (changed && since) {
    result.sinceRef = since;
  }

  return result;
}
