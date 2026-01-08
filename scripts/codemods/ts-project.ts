#!/usr/bin/env tsx

/**
 * Shared ts-morph Project initialization utility
 * 
 * Provides consistent ts-morph Project configuration across all codemod and lint scripts.
 * Centralizes common options and provides a factory function for creating projects.
 */

import { Project } from 'ts-morph';

/**
 * Default project options for codemod and lint scripts
 * These options provide consistent behavior across all scripts
 */
export const DEFAULT_PROJECT_OPTIONS = {
  tsConfigFilePath: 'tsconfig.json',
  skipAddingFilesFromTsConfig: true,
  // Speed up in tests and scripts; callers can opt-in to add files
  useInMemoryFileSystem: true,
  // Add any other common options here as needed
} as const;

/**
 * Extended project options interface for edge cases
 */
export interface CreateTsProjectOptions {
  /**
   * TypeScript config file path
   */
  tsConfigFilePath?: string;
  
  /**
   * Whether to add all source files automatically
   * Default: false (scripts typically add files manually)
   */
  addAllSourceFiles?: boolean;
  
  /**
   * Specific source file patterns to add
   * Only used if addAllSourceFiles is true
   */
  sourceFilePatterns?: string[];

  /**
   * Whether to use an in-memory file system for ts-morph
   * Defaults to true via DEFAULT_PROJECT_OPTIONS
   */
  useInMemoryFileSystem?: boolean;
}

/**
 * Create a ts-morph Project with consistent configuration
 * 
 * @param options - Optional project configuration overrides
 * @returns Configured ts-morph Project instance
 */
export function createTsProject(options: CreateTsProjectOptions = {}): Project {
  const {
    addAllSourceFiles = false,
    sourceFilePatterns = ['**/*.{ts,tsx}'],
    ...projectOptions
  } = options;

  // Merge default options with provided options
  const finalOptions: any = {
    ...DEFAULT_PROJECT_OPTIONS,
    ...projectOptions,
  };

  // In in-memory mode, avoid reading tsconfig to prevent missing file errors
  if (finalOptions.useInMemoryFileSystem) {
    delete finalOptions.tsConfigFilePath;
    finalOptions.compilerOptions = finalOptions.compilerOptions ?? {};
  } else {
    // When not in memory FS, if tsconfig doesn't exist, fall back gracefully
    try {
      const fs = require('fs');
      if (!fs.existsSync(finalOptions.tsConfigFilePath)) {
        delete finalOptions.tsConfigFilePath;
        finalOptions.compilerOptions = finalOptions.compilerOptions ?? {};
      }
    } catch {
      // ignore
    }
  }

  const project = new Project(finalOptions);
  // Ensure a baseline compiler setup when no tsconfig is provided
  if (!(project as any)._context.compilerOptions) {
    try {
      (project as any)._context.compilerOptions = {};
    } catch {
      // noop
    }
  }

  // Optionally add all source files automatically
  if (addAllSourceFiles) {
    sourceFilePatterns.forEach(pattern => {
      project.addSourceFilesAtPaths(pattern);
    });
  }

  return project;
}

/**
 * Create a ts-morph Project with all source files added automatically
 * Useful for scripts that need to process the entire codebase
 * 
 * @param options - Optional project configuration overrides
 * @returns Configured ts-morph Project instance with all source files added
 */
export function createTsProjectWithAllFiles(options: CreateTsProjectOptions = {}): Project {
  return createTsProject({
    ...options,
    addAllSourceFiles: true,
  });
}

/**
 * Create a ts-morph Project optimized for codemod scripts
 * Includes common patterns for source files that codemods typically process
 * 
 * @param options - Optional project configuration overrides
 * @returns Configured ts-morph Project instance
 */
export function createCodemodProject(options: CreateTsProjectOptions = {}): Project {
  return createTsProject({
    ...options,
    addAllSourceFiles: true,
    sourceFilePatterns: [
      'lib/**/*.{ts,tsx}',
      'app/**/*.{ts,tsx}',
      'actions/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'contexts/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'types/**/*.{ts,tsx}',
      'scripts/**/*.{ts,tsx}',
    ],
  });
}

/**
 * Create a ts-morph Project optimized for lint scripts
 * Includes patterns for files that lint scripts typically analyze
 * 
 * @param options - Optional project configuration overrides
 * @returns Configured ts-morph Project instance
 */
export function createLintProject(options: CreateTsProjectOptions = {}): Project {
  return createTsProject({
    ...options,
    addAllSourceFiles: true,
    sourceFilePatterns: [
      'lib/**/*.{ts,tsx}',
      'app/**/*.{ts,tsx}',
      'actions/**/*.{ts,tsx}',
      'hooks/**/*.{ts,tsx}',
      'contexts/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
      'types/**/*.{ts,tsx}',
      'scripts/**/*.{ts,tsx}',
      'tests/**/*.{ts,tsx}',
    ],
  });
}

