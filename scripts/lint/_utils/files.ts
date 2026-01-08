/**
 * File walking and globbing utilities for lint scripts
 * Cross-platform safe, uses existing repo utilities where possible
 */

import { globbySync } from 'globby';
import { globSync } from 'glob';
import { COMMON_IGNORE_GLOBS } from '../../utils/constants';
import { getRepoRoot } from './paths';
import { getCachedFiles, setCachedFiles } from './file-cache';

/**
 * Find files using globby (recommended for most cases)
 * Uses COMMON_IGNORE_GLOBS by default
 * Caches results to avoid redundant file system walks
 */
export function findFiles(
  patterns: string | string[],
  options: {
    ignore?: string[];
    cwd?: string;
  } = {}
): string[] {
  const { ignore = [], cwd = getRepoRoot() } = options;
  
  // Check cache first
  const cacheKey = {
    patterns,
    ignore: [...COMMON_IGNORE_GLOBS, ...ignore],
    cwd,
  };
  
  const cached = getCachedFiles(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // Perform glob and cache result
  const files = globbySync(patterns, {
    ignore: cacheKey.ignore,
    cwd,
    absolute: false,
  });
  
  setCachedFiles(cacheKey, files);
  return files;
}

/**
 * Find files using glob (for compatibility with existing scripts)
 * Uses COMMON_IGNORE_GLOBS by default
 * Caches results to avoid redundant file system walks
 */
export function findFilesGlob(
  patterns: string | string[],
  options: {
    ignore?: string[];
    cwd?: string;
  } = {}
): string[] {
  const { ignore = [], cwd = getRepoRoot() } = options;
  
  // Check cache first (use pattern array as-is for cache key)
  const patternArray = Array.isArray(patterns) ? patterns : [patterns];
  const cacheKey = {
    patterns: patternArray,
    ignore: [...COMMON_IGNORE_GLOBS, ...ignore],
    cwd,
  };
  
  const cached = getCachedFiles(cacheKey);
  if (cached !== null) {
    return cached;
  }
  
  // Perform glob and cache result
  const allFiles: string[] = [];
  
  for (const pattern of patternArray) {
    try {
      const files = globSync(pattern, {
        ignore: cacheKey.ignore,
        cwd,
      });
      allFiles.push(...files);
    } catch {
      // Skip patterns that fail
      continue;
    }
  }
  
  const result = [...new Set(allFiles)]; // Deduplicate
  setCachedFiles(cacheKey, result);
  return result;
}
