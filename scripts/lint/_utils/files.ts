/**
 * File walking and globbing utilities for lint scripts
 * Cross-platform safe, uses existing repo utilities where possible
 */

import { globbySync } from 'globby';
import { globSync } from 'glob';
import { COMMON_IGNORE_GLOBS } from '../../utils/constants';
import { getRepoRoot } from './paths';

/**
 * Find files using globby (recommended for most cases)
 * Uses COMMON_IGNORE_GLOBS by default
 */
export function findFiles(
  patterns: string | string[],
  options: {
    ignore?: string[];
    cwd?: string;
  } = {}
): string[] {
  const { ignore = [], cwd = getRepoRoot() } = options;
  
  return globbySync(patterns, {
    ignore: [...COMMON_IGNORE_GLOBS, ...ignore],
    cwd,
    absolute: false,
  });
}

/**
 * Find files using glob (for compatibility with existing scripts)
 * Uses COMMON_IGNORE_GLOBS by default
 */
export function findFilesGlob(
  patterns: string | string[],
  options: {
    ignore?: string[];
    cwd?: string;
  } = {}
): string[] {
  const { ignore = [], cwd = getRepoRoot() } = options;
  
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  const allFiles: string[] = [];
  
  for (const pattern of patternArray) {
    try {
      const files = globSync(pattern, {
        ignore: [...COMMON_IGNORE_GLOBS, ...ignore],
        cwd,
      });
      allFiles.push(...files);
    } catch {
      // Skip patterns that fail
      continue;
    }
  }
  
  return [...new Set(allFiles)]; // Deduplicate
}
