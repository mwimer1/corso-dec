/**
 * File list caching utility for lint scripts
 * Reduces redundant file system walks by caching glob results per pattern+options
 */

import { createHash } from 'crypto';

interface CacheKey {
  patterns: string | string[];
  ignore: string[];
  cwd: string;
}

interface CacheEntry {
  files: string[];
  timestamp: number;
}

// In-memory cache (per process execution)
const fileCache = new Map<string, CacheEntry>();

/**
 * Generate cache key from patterns and options
 */
function createCacheKey(key: CacheKey): string {
  const hash = createHash('sha256');
  
  const patterns = Array.isArray(key.patterns) 
    ? key.patterns.sort().join(',')
    : key.patterns;
  const ignore = [...key.ignore].sort().join(',');
  
  hash.update(patterns);
  hash.update(ignore);
  hash.update(key.cwd);
  
  return hash.digest('hex').substring(0, 16);
}

/**
 * Get cached file list if available
 */
export function getCachedFiles(key: CacheKey): string[] | null {
  const cacheKey = createCacheKey(key);
  const entry = fileCache.get(cacheKey);
  
  if (!entry) {
    return null;
  }
  
  // Cache is valid for the current process execution
  // (No timestamp validation needed - cache is process-scoped)
  return entry.files;
}

/**
 * Cache file list for future use
 */
export function setCachedFiles(key: CacheKey, files: string[]): void {
  const cacheKey = createCacheKey(key);
  fileCache.set(cacheKey, {
    files: [...files], // Copy array to prevent mutations
    timestamp: Date.now(),
  });
}

/**
 * Clear all cached file lists (useful for testing or cleanup)
 */
export function clearFileCache(): void {
  fileCache.clear();
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: fileCache.size,
    keys: Array.from(fileCache.keys()),
  };
}
