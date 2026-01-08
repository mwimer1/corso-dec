/**
 * @fileoverview File system utilities for docs maintenance
 * @description File scanning, globbing, and selection operations
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import { COMMON_IGNORE_GLOBS } from '../../../utils/constants';
import type { MarkdownFile, FileSelection } from '../types';
import { DEFAULT_GLOB_PATTERNS, EXCLUDE_PATTERNS } from '../constants';

/**
 * Scans for markdown files matching the given patterns
 */
export async function scanMarkdownFiles(
  patterns: string[] = [...DEFAULT_GLOB_PATTERNS],
  exclude: string[] = [...EXCLUDE_PATTERNS]
): Promise<MarkdownFile[]> {
  // Merge common ignore patterns with provided excludes
  const allExcludes = [...COMMON_IGNORE_GLOBS, ...exclude];
  const files = await globby(patterns, {
    ignore: allExcludes,
    absolute: true,
    gitignore: true,
  });

  const markdownFiles: MarkdownFile[] = [];

  for (const filePath of files) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      markdownFiles.push({
        path: filePath,
        content,
        frontmatter: {},
      });
    } catch (error) {
      console.warn(`Warning: Could not read ${filePath}:`, error);
    }
  }

  return markdownFiles;
}

/**
 * Selects files based on include/exclude patterns
 */
export function selectFilesByPatterns(
  files: MarkdownFile[],
  include?: string[],
  exclude?: string[]
): FileSelection {
  const selected: MarkdownFile[] = [];
  const excluded: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file.path);

    // Check if file should be excluded
    const shouldExclude = exclude?.some(pattern => {
      return relativePath.includes(pattern) || new RegExp(pattern).test(relativePath);
    });

    if (shouldExclude) {
      excluded.push(relativePath);
      continue;
    }

    // Check if file should be included (if include patterns specified)
    const shouldInclude = !include || include.some(pattern => {
      return relativePath.includes(pattern) || new RegExp(pattern).test(relativePath);
    });

    if (shouldInclude) {
      selected.push(file);
    } else {
      excluded.push(relativePath);
    }
  }

  return {
    files: selected,
    excluded,
    errors,
  };
}

/**
 * Reads a markdown file and parses its frontmatter
 */
export async function readMarkdownFile(filePath: string): Promise<MarkdownFile | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return {
      path: filePath,
      content,
      frontmatter: parseFrontmatter(content),
    };
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error);
    return null;
  }
}

/**
 * Writes a markdown file with updated content
 */
export async function writeMarkdownFile(file: MarkdownFile): Promise<boolean> {
  try {
    await fs.writeFile(file.path, file.content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing ${file.path}:`, error);
    return false;
  }
}

/**
 * Simple frontmatter parser (extracts YAML frontmatter from markdown)
 */
function parseFrontmatter(content: string): Record<string, string> {
  const frontmatter: Record<string, string> = {};

  // Check if content starts with frontmatter
  if (!content.startsWith('---')) {
    return frontmatter;
  }

  // Find the end of frontmatter
  const endIndex = content.indexOf('\n---', 3);
  if (endIndex === -1) {
    return frontmatter;
  }

  const fmContent = content.slice(3, endIndex).trim();

  // Simple key-value parsing (basic YAML-like)
  const lines = fmContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      const trimmedKey = key?.trim();
      const trimmedValue = value?.replace(/^["']|["']$/g, '').trim();
      if (trimmedKey && trimmedValue !== undefined) {
        frontmatter[trimmedKey] = trimmedValue;
      }
    }
  }

  return frontmatter;
}

/**
 * Checks if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets file modification time
 */
export async function getFileMtime(filePath: string): Promise<Date | null> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
}

/**
 * Checks if a path is a directory
 */
export async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

