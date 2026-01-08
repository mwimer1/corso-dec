#!/usr/bin/env tsx
/**
 * Common utilities for CI check scripts
 * Reduces duplication in file checking and validation logic
 */

import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Result interface for CI check operations
 * 
 * All check scripts should return arrays of CheckResult objects for consistent
 * error reporting and exit code handling.
 */
export interface CheckResult {
  success: boolean;
  message: string;
  details?: string[];
  warnings?: string[];
  recommendations?: string[];
}

/**
 * Checks files matching a pattern and validates their content
 * 
 * This is a common pattern for CI checks that need to:
 * 1. Find files matching glob pattern(s)
 * 2. Read and validate each file's content
 * 3. Return structured results for reporting
 * 
 * @param pattern - Glob pattern(s) to match files (string or array of strings)
 * @param contentChecker - Async function that validates file content and returns CheckResult
 * @returns Array of CheckResult objects, one per file checked
 * 
 * @example
 * ```ts
 * const results = await checkFilesWithPattern(
 *   'app/(protected)/dashboard/page.tsx',
 *   async (content, filePath) => {
 *     const hasAuth = /\\bauth\\s*\\(/.test(content);
 *     return {
 *       success: hasAuth,
 *       message: hasAuth ? 'Has auth' : 'Missing auth'
 *     };
 *   }
 * );
 * ```
 */
export async function checkFilesWithPattern(
  pattern: string | string[],
  contentChecker: (content: string, filePath: string) => Promise<CheckResult>
): Promise<CheckResult[]> {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const files = await globby(patterns, { absolute: true });
  const results: CheckResult[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const result = await contentChecker(content, file);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        message: `Failed to read ${file}`,
        details: [error instanceof Error ? error.message : String(error)]
      });
    }
  }

  return results;
}

/**
 * Options for checking layout files with custom boundary conditions
 */
export interface CheckLayoutOptions {
  /**
   * Function that determines if we should stop walking up the directory tree.
   * Receives the current directory path. Returns true to stop, false to continue.
   * 
   * @example
   * ```ts
   * // Stop when outside (protected) directory
   * boundaryPredicate: (dir) => !dir.includes(path.sep + '(protected)')
   * 
   * // Stop when outside app directory (default)
   * boundaryPredicate: (dir) => !dir.includes(path.sep + 'app' + path.sep)
   * ```
   */
  boundaryPredicate?: (dir: string) => boolean;
}

/**
 * Checks if a layout file in the directory hierarchy has a specific export pattern
 * 
 * Walks up the directory tree from startDir, checking each layout.tsx file for the
 * given export pattern. Stops when the pattern is found or when the boundary
 * predicate returns true.
 * 
 * @param startDir - Directory path to start checking from
 * @param exportPattern - Regex pattern to match exports in layout files
 * @param options - Optional configuration for boundary checking
 * @returns true if export pattern found in any layout in the hierarchy, false otherwise
 * 
 * @example
 * ```ts
 * // Check for auth() in protected routes
 * const hasAuth = await checkLayoutHasExport(
 *   'app/(protected)/dashboard/account',
 *   /\bauth\s*\(/,
 *   { boundaryPredicate: (dir) => !dir.includes(path.sep + '(protected)') }
 * );
 * ```
 */
export async function checkLayoutHasExport(
  startDir: string,
  exportPattern: RegExp,
  options: CheckLayoutOptions = {}
): Promise<boolean> {
  const { boundaryPredicate = (dir) => !dir.includes(path.sep + 'app' + path.sep) } = options;
  let dir = startDir;

  while (true) {
    const layout = path.join(dir, 'layout.tsx');
    try {
      await fs.access(layout);
      const content = await fs.readFile(layout, 'utf8');
      if (exportPattern.test(content)) return true;
    } catch {}

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;

    // Stop climbing if boundary predicate says so
    if (boundaryPredicate(dir)) break;
  }

  return false;
}

/**
 * Common pattern for checking protected routes have auth
 * 
 * @deprecated Use checkLayoutHasExport with boundaryPredicate option instead
 */
async function checkProtectedRouteHasAuth(
  startDir: string,
  authPattern: RegExp = /\bauth\s*\(/
): Promise<boolean> {
  return checkLayoutHasExport(startDir, authPattern);
}

/**
 * Checks if a public route has metadata exports in its layout hierarchy
 * 
 * Walks up the directory tree from startDir, checking each layout.tsx file
 * for metadata exports (either `export const metadata =` or `generateMetadata` function).
 * Stops when metadata is found or when walking outside the app directory.
 * 
 * @param startDir - Directory path to start checking from (typically a page directory)
 * @param metadataPattern - Optional regex pattern to match metadata exports.
 *                          Defaults to matching standard Next.js metadata patterns
 * @returns true if metadata found in current or parent layout, false otherwise
 * 
 * @example
 * ```ts
 * const hasMetadata = await checkPublicRouteHasMetadata('app/(marketing)/about');
 * if (!hasMetadata) {
 *   // Route is missing metadata
 * }
 * ```
 */
export async function checkPublicRouteHasMetadata(
  startDir: string,
  metadataPattern: RegExp = /export\s+const\s+metadata\s*=|export\s+async\s+function\s+generateMetadata\s*\(/
): Promise<boolean> {
  return checkLayoutHasExport(startDir, metadataPattern);
}


