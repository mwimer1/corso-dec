#!/usr/bin/env tsx
/**
 * Common utilities for codemod scripts
 * Reduces duplication in file processing and transformation logic
 */

import { discoverTypeScriptFiles } from './file-discovery';
import { createCodemodProject } from './ts-project';

export interface CodemodResult {
  modifiedFiles: number;
  totalChanges: number;
  errors: string[];
}

export interface FileProcessor {
  (content: string, filePath: string): Promise<{ modified: boolean; changes: number; error?: string }>;
}

/**
 * Common pattern for processing TypeScript files with ts-morph
 */
export async function processTypeScriptFiles(
  processor: FileProcessor,
  options: {
    excludeFiles?: string[];
    includeTestFiles?: boolean;
  } = {}
): Promise<CodemodResult> {
  const files = discoverTypeScriptFiles(options);
  // Using createCodemodProject for this is a shared utility for codemod scripts
  const project = createCodemodProject();
  
  let modifiedFiles = 0;
  let totalChanges = 0;
  const errors: string[] = [];

  for (const filePath of files) {
    try {
      const sourceFile = project.addSourceFileAtPath(filePath);
      const content = sourceFile.getText();
      
      const result = await processor(content, filePath);
      
      if (result.modified) {
        sourceFile.saveSync();
        modifiedFiles++;
        totalChanges += result.changes;
      }
      
      if (result.error) {
        errors.push(`${filePath}: ${result.error}`);
      }
    } catch (error) {
      errors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { modifiedFiles, totalChanges, errors };
}

/**
 * Common pattern for import transformations
 */
export function createImportTransformer(
  importReplacements: Record<string, string>
): FileProcessor {
  return async (content: string, filePath: string) => {
    let modified = false;
    let changes = 0;
    
    // Simple string replacement for imports
    for (const [oldImport, newImport] of Object.entries(importReplacements)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        modified = true;
        changes++;
      }
    }
    
    return { modified, changes };
  };
}

/**
 * Common pattern for environment variable transformations
 */
export function createEnvTransformer(
  fromPattern: string,
  toPattern: string
): FileProcessor {
  return async (content: string, filePath: string) => {
    let modified = false;
    let changes = 0;
    
    // Replace env.property with getEnv().property
    const envPattern = new RegExp(`\\b${fromPattern}\\.(\\w+)`, 'g');
    if (envPattern.test(content)) {
      content = content.replace(envPattern, `${toPattern}.$1`);
      modified = true;
      changes++;
    }
    
    return { modified, changes };
  };
}

/**
 * Common reporting for codemod results
 */
export function reportCodemodResults(result: CodemodResult, operation: string): void {
  console.log(`\n✅ ${operation} complete!`);
  console.log(`📊 Modified ${result.modifiedFiles} files with ${result.totalChanges} total changes`);
  
  if (result.errors.length > 0) {
    console.log(`\n⚠️  ${result.errors.length} errors encountered:`);
    result.errors.forEach(error => console.log(`   - ${error}`));
  }
  
  if (result.errors.length === 0) {
    console.log(`\n🎉 All files processed successfully!`);
  }
}

