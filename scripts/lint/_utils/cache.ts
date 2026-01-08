#!/usr/bin/env tsx
// scripts/lint/_utils/cache.ts
// Caching utilities for validation scripts based on file hashes

import { createHash } from 'crypto';
import { existsSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const CACHE_DIR = join(process.cwd(), 'node_modules', '.cache', 'validation-cache');

/**
 * Get file hash for cache invalidation
 */
export function getFileHash(filePath: string): string | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const content = readFileSync(filePath);
    const stats = statSync(filePath);
    
    // Include both content and mtime in hash to catch modifications
    const hash = createHash('sha256');
    hash.update(content);
    hash.update(stats.mtimeMs.toString());
    
    return hash.digest('hex').substring(0, 16); // Use first 16 chars for shorter keys
  } catch (error) {
    return null;
  }
}

/**
 * Get multiple file hashes combined
 */
export function getFilesHash(filePaths: string[]): string | null {
  const hashes = filePaths
    .map((path) => getFileHash(path))
    .filter((hash): hash is string => hash !== null);

  if (hashes.length === 0) {
    return null;
  }

  const combined = createHash('sha256');
  hashes.forEach((hash) => combined.update(hash));
  return combined.digest('hex').substring(0, 16);
}

/**
 * Get cached result if available and still valid
 */
export function getCachedResult(cacheKey: string, filePaths: string[]): boolean | null {
  try {
    // Ensure cache directory exists
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cacheFile = join(CACHE_DIR, `${cacheKey}.cache`);
    
    if (!existsSync(cacheFile)) {
      return null; // No cache exists
    }

    // Check if any files have changed since cache was created
    const currentHash = getFilesHash(filePaths);
    if (!currentHash) {
      return null; // Can't compute hash, skip cache
    }

    const cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
    
    // If hash matches, cache is valid
    if (cached.hash === currentHash) {
      return cached.success;
    }

    // Hash mismatch - cache invalid
    return null;
  } catch (error) {
    // If cache read fails, return null (no cache)
    return null;
  }
}

/**
 * Save validation result to cache
 */
export function saveCachedResult(
  cacheKey: string,
  filePaths: string[],
  success: boolean
): void {
  try {
    // Ensure cache directory exists
    if (!existsSync(CACHE_DIR)) {
      mkdirSync(CACHE_DIR, { recursive: true });
    }

    const cacheFile = join(CACHE_DIR, `${cacheKey}.cache`);
    const hash = getFilesHash(filePaths);

    if (!hash) {
      return; // Can't compute hash, don't cache
    }

    const cacheData = {
      hash,
      success,
      timestamp: Date.now(),
    };

    writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
  } catch (error) {
    // Fail silently - caching is optional
  }
}

/**
 * Check if specific files are staged in git
 */
export function hasStagedFiles(patterns: (string | RegExp)[]): boolean {
  try {
    const { execFileSync } = require('child_process');
    
    // Get all staged files
    const output = execFileSync('git', ['diff', '--cached', '--name-only'], {
      encoding: 'utf8',
    });

    const stagedFiles = output
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);

    // Check if any staged file matches the patterns
    return patterns.some((pattern) => {
      if (typeof pattern === 'string') {
        return stagedFiles.includes(pattern);
      } else {
        // RegExp pattern
        return stagedFiles.some((file: string) => pattern.test(file));
      }
    });
  } catch (error) {
    // If git command fails, assume files changed to be safe
    return true;
  }
}
