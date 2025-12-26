#!/usr/bin/env tsx
/**
 * Guardrail: Check for placeholder-only directories
 * 
 * Fails if a directory exists that contains only README.md and no other files
 * (except allowed exceptions).
 * 
 * This prevents directory drift where empty directories are kept with just
 * placeholder READMEs instead of being removed or populated with actual code.
 * 
 * Usage:
 *   tsx scripts/ci/check-placeholder-directories.ts
 */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { CheckResult } from './check-common.js';

/**
 * Directories that are explicitly allowed to be placeholder-only.
 * These are intentionally kept as documentation-only directories.
 */
const ALLOWED_PLACEHOLDER_DIRECTORIES = new Set<string>([
  // Parent directories that contain actual code subdirectories (not truly placeholder)
  // hooks/ - All hooks moved to domain homes (components/ui/hooks/, components/chat/hooks/, etc.)
]);

/**
 * Directories to scan for placeholder-only subdirectories.
 * Only checks these top-level directories, not the entire repo.
 */
const SCAN_DIRECTORIES = [
  'hooks',
  'contexts',
  // Add other directories to scan as needed
];

/**
 * Files that are allowed in a "placeholder-only" directory.
 * If a directory contains only these files, it's considered a placeholder.
 */
const ALLOWED_PLACEHOLDER_FILES = new Set<string>([
  'README.md',
  '.gitkeep', // Sometimes used to keep empty directories in git
]);

interface PlaceholderDirectory {
  path: string;
  files: string[];
}

/**
 * Check if a directory is placeholder-only (only contains allowed files)
 */
async function isPlaceholderOnly(dirPath: string): Promise<boolean> {
  try {
    const entries = await readdir(dirPath);
    
    // Filter out directories and check only files
    const files: string[] = [];
    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stats = await stat(fullPath);
      if (stats.isFile()) {
        files.push(entry);
      }
    }
    
    // If no files, it's not a placeholder (it's just empty)
    if (files.length === 0) {
      return false;
    }
    
    // Check if all files are in the allowed list
    const allAllowed = files.every(file => ALLOWED_PLACEHOLDER_FILES.has(file));
    
    return allAllowed && files.length > 0;
  } catch (error) {
    // If we can't read the directory, skip it
    return false;
  }
}

/**
 * Recursively find all placeholder-only directories
 */
async function findPlaceholderDirectories(
  baseDir: string,
  relativePath: string = ''
): Promise<PlaceholderDirectory[]> {
  const placeholders: PlaceholderDirectory[] = [];
  const fullPath = relativePath ? join(baseDir, relativePath) : baseDir;
  
  try {
    // Check if this directory itself is placeholder-only
    if (await isPlaceholderOnly(fullPath)) {
      const entries = await readdir(fullPath);
      
      // Get list of files (not directories)
      const fileList: string[] = [];
      for (const entry of entries) {
        const entryPath = join(fullPath, entry);
        const stats = await stat(entryPath);
        if (stats.isFile()) {
          fileList.push(entry);
        }
      }
      
      placeholders.push({
        path: relativePath || baseDir,
        files: fileList,
      });
    }
    
    // Recursively check subdirectories
    const entries = await readdir(fullPath);
    for (const entry of entries) {
      const entryPath = join(fullPath, entry);
      const stats = await stat(entryPath);
      
      if (stats.isDirectory()) {
        const subRelativePath = relativePath ? join(relativePath, entry) : entry;
        const subPlaceholders = await findPlaceholderDirectories(baseDir, subRelativePath);
        placeholders.push(...subPlaceholders);
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }
  
  return placeholders;
}

/**
 * Main check function
 */
async function checkPlaceholderDirectories(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const allPlaceholders: PlaceholderDirectory[] = [];
  
  for (const scanDir of SCAN_DIRECTORIES) {
    try {
      const placeholders = await findPlaceholderDirectories(scanDir);
      
      // Filter out allowed directories
      const violations = placeholders.filter(
        p => !ALLOWED_PLACEHOLDER_DIRECTORIES.has(p.path)
      );
      
      allPlaceholders.push(...violations);
    } catch (error) {
      // If scan directory doesn't exist, that's fine
      continue;
    }
  }
  
  if (allPlaceholders.length === 0) {
    results.push({
      success: true,
      message: 'No placeholder-only directories found',
    });
    return results;
  }
  
  // Group violations by directory
  const violationsByDir = new Map<string, string[]>();
  for (const placeholder of allPlaceholders) {
    if (!violationsByDir.has(placeholder.path)) {
      violationsByDir.set(placeholder.path, []);
    }
    violationsByDir.get(placeholder.path)!.push(...placeholder.files);
  }
  
  const details: string[] = [];
  for (const [dir, files] of violationsByDir.entries()) {
    details.push(
      `  ${dir}/ contains only: ${files.join(', ')}`
    );
    details.push(
      `    → Either add actual code files or remove the directory if it's no longer needed`
    );
  }
  
  results.push({
    success: false,
    message: `Found ${allPlaceholders.length} placeholder-only directory(ies)`,
    details,
    recommendations: [
      'Remove placeholder directories if they are no longer needed',
      'Or add actual implementation files to make them non-placeholder',
      'Or add the directory to ALLOWED_PLACEHOLDER_DIRECTORIES if it is intentionally placeholder-only',
    ],
  });
  
  return results;
}

/**
 * Main entry point
 */
async function main() {
  const results = await checkPlaceholderDirectories();
  
  if (results.some(r => !r.success)) {
    console.error('\n❌ Placeholder directory check failed:\n');
    for (const result of results) {
      if (!result.success) {
        console.error(result.message);
        if (result.details) {
          result.details.forEach(detail => console.error(detail));
        }
        if (result.recommendations) {
          console.error('\n💡 Recommendations:');
          result.recommendations.forEach(rec => console.error(`  - ${rec}`));
        }
      }
    }
    console.error('');
    process.exit(1);
  }
  
  console.log('✅ Placeholder directory check passed');
  process.exit(0);
}

void main();

