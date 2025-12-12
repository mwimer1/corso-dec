#!/usr/bin/env tsx
/**
 * Common utilities for environment import transformations
 * Consolidates patterns used across migrate-env-imports.ts and update-env-usage.ts
 */

import type { Project } from 'ts-morph';

interface EnvTransformationResult {
  modifiedFiles: number;
  totalChanges: number;
  errors: string[];
}

interface EnvImportPattern {
  from: string;
  to: string;
  description: string;
}

/**
 * Common environment import patterns
 */
const COMMON_ENV_PATTERNS: EnvImportPattern[] = [
  {
    from: 'process.env',
    to: 'getEnv()',
    description: 'Replace process.env with getEnv()'
  },
  {
    from: '@/lib/config/env',
    to: '@/lib/shared/env',
    description: 'Update env import path'
  }
];

/**
 * Common pattern for transforming environment imports
 */
function createEnvImportTransformer(
  patterns: EnvImportPattern[] = COMMON_ENV_PATTERNS
) {
  return (project: Project): EnvTransformationResult => {
    let modifiedFiles = 0;
    let totalChanges = 0;
    const errors: string[] = [];

    project.getSourceFiles().forEach(sourceFile => {
      let modified = false;
      let changes = 0;

      try {
        // Transform import declarations
        sourceFile.getImportDeclarations().forEach(importDecl => {
          const moduleSpecifier = importDecl.getModuleSpecifierValue();
          const pattern = patterns.find(p => moduleSpecifier === p.from);
          
          if (pattern) {
            importDecl.setModuleSpecifier(pattern.to);
            modified = true;
            changes++;
          }
        });

        // Transform property access expressions
        sourceFile.forEachDescendant(node => {
          if (node.getKindName() === 'PropertyAccessExpression') {
            const text = node.getText();
            const pattern = patterns.find(p => text.startsWith(p.from));
            
            if (pattern) {
              const newText = text.replace(pattern.from, pattern.to);
              node.replaceWithText(newText);
              modified = true;
              changes++;
            }
          }
        });

        if (modified) {
          sourceFile.saveSync();
          modifiedFiles++;
          totalChanges += changes;
        }
      } catch (error) {
        errors.push(`${sourceFile.getFilePath()}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });

    return { modifiedFiles, totalChanges, errors };
  };
}

/**
 * Common pattern for finding environment usage
 */
function findEnvUsage(project: Project): string[] {
  const usageFiles: string[] = [];
  
  project.getSourceFiles().forEach(sourceFile => {
    const text = sourceFile.getText();
    
    if (text.includes('process.env') || text.includes('@/lib/config/env')) {
      usageFiles.push(sourceFile.getFilePath());
    }
  });
  
  return usageFiles;
}

/**
 * Common reporting for environment transformations
 */
function reportEnvTransformationResults(
  result: EnvTransformationResult,
  operation: string
): void {
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

