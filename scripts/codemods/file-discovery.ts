#!/usr/bin/env tsx

/**
 * Centralized file discovery utility for codemod scripts
 * 
 * Provides consistent TypeScript file discovery patterns and ignore rules
 * across all codemod scripts in the project.
 */

import { glob } from 'glob';

/**
 * Standard ignore patterns for TypeScript file discovery
 * These patterns exclude files that shouldn't be processed by codemods
 */
export const STANDARD_IGNORE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'reports/**',
  'dist/**',
  'build/**',
  'coverage/**',
  '*.d.ts',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.stories.tsx',
  '**/*.config.ts',
  '**/*.config.js'
];

/**
 * Standard TypeScript file patterns for codemod processing
 * These patterns target the main source directories that should be processed
 */
export const STANDARD_TS_PATTERNS = [
  'lib/**/*.{ts,tsx}',
  'app/**/*.{ts,tsx}',
  'tests/**/*.{ts,tsx}',
  'actions/**/*.{ts,tsx}',
  'hooks/**/*.{ts,tsx}',
  'contexts/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'types/**/*.{ts,tsx}',
  'scripts/**/*.{ts,tsx}'
];

/**
 * Extended TypeScript file patterns that include additional directories
 * Use this when you need to process a broader range of files
 */
export const EXTENDED_TS_PATTERNS = [
  ...STANDARD_TS_PATTERNS,
  'docs/**/*.{ts,tsx}',
  'config/**/*.{ts,tsx}',
  'supabase/**/*.{ts,tsx}'
];

/**
 * Discover TypeScript files using standard patterns and ignore rules
 * 
 * @param options - Configuration options for file discovery
 * @returns Array of file paths that match the discovery criteria
 */
export function discoverTypeScriptFiles(options: {
  patterns?: string[];
  ignore?: string[];
  excludeFiles?: string[];
  includeTestFiles?: boolean;
} = {}): string[] {
  const {
    patterns = STANDARD_TS_PATTERNS,
    ignore = STANDARD_IGNORE_PATTERNS,
    excludeFiles = [],
    includeTestFiles = false
  } = options;

  // Build ignore patterns
  let ignorePatterns = [...ignore];
  
  // Add excluded files to ignore patterns
  if (excludeFiles.length > 0) {
    ignorePatterns.push(...excludeFiles);
  }
  
  // Optionally include test files by removing test file patterns from ignore
  if (includeTestFiles) {
    ignorePatterns = ignorePatterns.filter(pattern => 
      !pattern.includes('*.test.') && 
      !pattern.includes('*.spec.') && 
      !pattern.includes('*.stories.')
    );
  }

  // Discover files using glob
  const files = patterns.flatMap(pattern => 
    glob.sync(pattern, { ignore: ignorePatterns })
  );

  // Remove duplicates and sort for consistent results
  return [...new Set(files)].sort();
}

/**
 * Discover TypeScript files with extended patterns
 * Includes additional directories like docs, config, etc.
 * 
 * @param options - Configuration options for file discovery
 * @returns Array of file paths that match the discovery criteria
 */
export function discoverExtendedTypeScriptFiles(options: {
  ignore?: string[];
  excludeFiles?: string[];
  includeTestFiles?: boolean;
} = {}): string[] {
  return discoverTypeScriptFiles({
    patterns: EXTENDED_TS_PATTERNS,
    ...options
  });
}

/**
 * Discover TypeScript files in specific directories only
 * 
 * @param directories - Array of directory patterns to search
 * @param options - Configuration options for file discovery
 * @returns Array of file paths that match the discovery criteria
 */
export function discoverTypeScriptFilesInDirectories(
  directories: string[],
  options: {
    ignore?: string[];
    excludeFiles?: string[];
    includeTestFiles?: boolean;
  } = {}
): string[] {
  const patterns = directories.map(dir => `${dir}/**/*.{ts,tsx}`);
  return discoverTypeScriptFiles({
    patterns,
    ...options
  });
}

/**
 * Get file discovery statistics
 * 
 * @param files - Array of file paths to analyze
 * @returns Statistics about the discovered files
 */
export function getFileDiscoveryStats(files: string[]): {
  totalFiles: number;
  byExtension: Record<string, number>;
  byDirectory: Record<string, number>;
} {
  const stats = {
    totalFiles: files.length,
    byExtension: {} as Record<string, number>,
    byDirectory: {} as Record<string, number>
  };

  for (const file of files) {
    // Count by extension
    const ext = file.split('.').pop() || '';
    stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;

    // Count by top-level directory
    const topDir = file.split('/')[0] || 'root';
    stats.byDirectory[topDir] = (stats.byDirectory[topDir] || 0) + 1;
  }

  return stats;
}

/**
 * Validate that discovered files exist and are readable
 * 
 * @param files - Array of file paths to validate
 * @returns Object with valid files and any errors encountered
 */
export function validateDiscoveredFiles(files: string[]): {
  validFiles: string[];
  errors: Array<{ file: string; error: string }>;
} {
  const validFiles: string[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    try {
      // Try to access the file to ensure it exists and is readable
      const fs = require('fs');
      fs.accessSync(file, fs.constants.R_OK);
      validFiles.push(file);
    } catch (error) {
      errors.push({
        file,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return { validFiles, errors };
}

