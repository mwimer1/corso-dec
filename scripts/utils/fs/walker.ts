import { globby } from 'globby';
import fs from 'node:fs';
import path from 'node:path';
import { COMMON_IGNORE_GLOBS, COMMON_IGNORE_PATTERNS } from '../constants';

export interface WalkOptions {
  maxDepth?: number;
  includeFiles?: boolean;
  includeDirs?: boolean;
  exclude?: string[];
  pattern?: string | string[];
  cwd?: string;
}

export interface WalkResult {
  files: string[];
  dirs: string[];
  total: number;
}

/**
 * Unified directory walker using globby (already used in script-common.ts)
 * Handles excludes, max depth, and file filtering
 * 
 * @param rootPath - Root directory to walk
 * @param options - Walk configuration options
 * @returns WalkResult with files and directories found
 */
export async function walkDirectory(
  rootPath: string,
  options: WalkOptions = {}
): Promise<WalkResult> {
  const {
    maxDepth = 10,
    includeFiles = true,
    includeDirs = true,
    exclude = [],
    pattern,
    cwd = process.cwd(),
  } = options;

  // Build ignore patterns
  const ignorePatterns = [
    ...COMMON_IGNORE_GLOBS,
    ...exclude.map(p => (p.includes('**') ? p : `**/${p}/**`)),
  ];

  // Use globby for efficient pattern matching
  const patterns = pattern
    ? Array.isArray(pattern)
      ? pattern
      : [pattern]
    : [`${rootPath}/**/*`];

  const allItems = await globby(patterns, {
    cwd,
    ignore: ignorePatterns,
    absolute: true,
    onlyFiles: !includeDirs,
    onlyDirectories: !includeFiles,
    deep: maxDepth,
  });

  const files: string[] = [];
  const dirs: string[] = [];

  for (const item of allItems) {
    try {
      const stats = await fs.promises.stat(item);
      if (stats.isDirectory()) {
        if (includeDirs) dirs.push(item);
      } else if (stats.isFile()) {
        if (includeFiles) files.push(item);
      }
    } catch {
      // Skip items that can't be stat'd
      continue;
    }
  }

  return {
    files: files.sort(),
    dirs: dirs.sort(),
    total: files.length + dirs.length,
  };
}

/**
 * Synchronous version for scripts that need it
 * Uses recursive directory traversal with depth control
 */
export function walkDirectorySync(
  rootPath: string,
  options: WalkOptions = {}
): WalkResult {
  const {
    maxDepth = 10,
    includeFiles = true,
    includeDirs = true,
    exclude = [],
  } = options;

  const files: string[] = [];
  const dirs: string[] = [];
  const excludeSet = new Set([...COMMON_IGNORE_PATTERNS, ...exclude]);

  function walk(currentPath: string, depth: number): void {
    if (depth > maxDepth) return;

    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      for (const item of items) {
        if (excludeSet.has(item.name)) continue;

        const fullPath = path.join(currentPath, item.name);
        try {
          if (item.isDirectory()) {
            if (includeDirs) dirs.push(fullPath);
            walk(fullPath, depth + 1);
          } else if (item.isFile() && includeFiles) {
            files.push(fullPath);
          }
        } catch {
          // Skip items we can't access
          continue;
        }
      }
    } catch {
      // Skip directories we can't read
    }
  }

  walk(rootPath, 0);

  return {
    files: files.sort(),
    dirs: dirs.sort(),
    total: files.length + dirs.length,
  };
}

/**
 * Walk directory and return tree structure (for scan-directory use case)
 */
export interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: TreeNode[];
  depth: number;
}

export function walkDirectoryTreeSync(
  rootPath: string,
  options: WalkOptions = {}
): TreeNode[] {
  const {
    maxDepth = 10,
    includeFiles = true,
    includeDirs = true,
    exclude = [],
  } = options;

  const excludeSet = new Set([...COMMON_IGNORE_PATTERNS, ...exclude]);

  function walk(currentPath: string, depth: number): TreeNode[] {
    if (depth > maxDepth) {
      return [];
    }

    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      const nodes: TreeNode[] = [];

      for (const item of items) {
        if (excludeSet.has(item.name)) continue;

        const fullPath = path.join(currentPath, item.name);
        try {
          const stats = fs.statSync(fullPath);
          const isDirectory = stats.isDirectory();

          if (isDirectory && includeDirs) {
            const children = walk(fullPath, depth + 1);
            nodes.push({
              name: item.name,
              path: fullPath,
              isDirectory: true,
              children,
              depth,
            });
          } else if (!isDirectory && includeFiles) {
            nodes.push({
              name: item.name,
              path: fullPath,
              isDirectory: false,
              depth,
            });
          }
        } catch {
          // Skip items we can't access
          continue;
        }
      }

      // Sort directories first, then files, both alphabetically
      return nodes.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    } catch {
      // Skip directories we can't read
      return [];
    }
  }

  return walk(rootPath, 0);
}

