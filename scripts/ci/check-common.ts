#!/usr/bin/env tsx
/**
 * Common utilities for CI check scripts
 * Reduces duplication in file checking and validation logic
 */

import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface CheckResult {
  success: boolean;
  message: string;
  details?: string[];
  warnings?: string[];
  recommendations?: string[];
}

/**
 * Common pattern for checking files exist and have specific content
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
 * Common pattern for checking layout files have specific exports
 */
async function checkLayoutHasExport(
  startDir: string,
  exportPattern: RegExp,
  exportName: string
): Promise<boolean> {
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

    // Stop climbing outside app directory
    if (!dir.includes(path.sep + 'app' + path.sep)) break;
  }

  return false;
}

/**
 * Common pattern for checking protected routes have auth
 */
async function checkProtectedRouteHasAuth(
  startDir: string,
  authPattern: RegExp = /\bauth\s*\(/
): Promise<boolean> {
  return checkLayoutHasExport(startDir, authPattern, 'auth()');
}

/**
 * Common pattern for checking public routes have metadata
 */
export async function checkPublicRouteHasMetadata(
  startDir: string,
  metadataPattern: RegExp = /export\s+const\s+metadata\s*=|export\s+async\s+function\s+generateMetadata\s*\(/
): Promise<boolean> {
  return checkLayoutHasExport(startDir, metadataPattern, 'metadata');
}


