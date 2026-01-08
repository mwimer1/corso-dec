/**
 * Path normalization and resolution utilities for lint scripts
 * Cross-platform safe path handling
 */

import { resolve, dirname, basename, join, normalize } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Get repository root directory (where package.json lives)
 */
export function getRepoRoot(): string {
  // Find package.json by walking up from cwd
  let current = resolve(process.cwd());
  while (current !== dirname(current)) {
    const pkgPath = join(current, 'package.json');
    if (existsSync(pkgPath)) {
      return current;
    }
    current = dirname(current);
  }
  return process.cwd(); // Fallback
}

/**
 * Normalize path for cross-platform compatibility
 * Converts Windows backslashes to forward slashes
 */
export function normalizePath(path: string): string {
  return normalize(path).replace(/\\/g, '/');
}

/**
 * Resolve path relative to repository root
 */
export function resolveFromRepo(relativePath: string): string {
  return resolve(getRepoRoot(), relativePath);
}

/**
 * Get relative path from repo root
 */
export function getRelativePath(absolutePath: string): string {
  const repoRoot = getRepoRoot();
  const normalized = normalizePath(absolutePath);
  const normalizedRoot = normalizePath(repoRoot);
  
  if (normalized.startsWith(normalizedRoot)) {
    return normalized.slice(normalizedRoot.length + 1); // +1 for leading slash
  }
  return normalized;
}

/**
 * Get filename from path (cross-platform)
 */
export function getFilename(filePath: string): string {
  return basename(filePath);
}
