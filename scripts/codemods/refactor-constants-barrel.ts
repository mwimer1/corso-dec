#!/usr/bin/env tsx
/**
 * @fileoverview Codemod to refactor deep imports of lib/shared/constants to use barrel imports
 * @description Replaces imports from @/lib/shared/constants/* with @/lib/shared/constants
 */

import { readFileSync } from 'fs';
import { glob } from 'glob';
import { Project } from 'ts-morph';

interface RefactorResult {
  filesProcessed: number;
  importsReplaced: number;
  errors: string[];
}

/**
 * Refactor deep imports to barrel imports
 */
function refactorConstantsBarrel(): RefactorResult {
  console.log('🔧 Refactoring deep imports to barrel imports for lib/shared/constants\n');
  
  const result: RefactorResult = {
    filesProcessed: 0,
    importsReplaced: 0,
    errors: []
  };

  try {
    // Initialize ts-morph project
    const project = new Project({
      tsConfigFilePath: 'tsconfig.json',
      skipAddingFilesFromTsConfig: true
    });

    // Find all TypeScript files
    const files = glob.sync('**/*.{ts,tsx}', {
      ignore: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'coverage/**',
        '**/*.d.ts',
        'tests/**/*'
      ]
    });

    console.log(`📋 Found ${files.length} TypeScript files to process\n`);

    files.forEach(filePath => {
      try {
        const sourceFile = project.addSourceFileAtPath(filePath);
        const originalContent = sourceFile.getFullText();
        let hasChanges = false;

        // Find all import declarations
        const importDeclarations = sourceFile.getImportDeclarations();
        
        importDeclarations.forEach(importDecl => {
          const moduleSpecifier = importDecl.getModuleSpecifierValue();
          
          // Check if it's a deep import from lib/shared/constants
          if (moduleSpecifier.startsWith('@/lib/shared/constants/') && 
              !moduleSpecifier.endsWith('/index') &&
              moduleSpecifier !== '@/lib/shared/constants') {
            
            console.log(`   🔄 ${filePath}: ${moduleSpecifier} → @/lib/shared/constants`);
            
            // Replace with barrel import
            importDecl.setModuleSpecifier('@/lib/shared/constants');
            hasChanges = true;
            result.importsReplaced++;
          }
        });

        if (hasChanges) {
          // Save the file
          sourceFile.saveSync();
          result.filesProcessed++;
        }

        // Remove from project to avoid memory issues
        project.removeSourceFile(sourceFile);
        
      } catch (error) {
        const errorMsg = `Failed to process ${filePath}: ${error}`;
        console.log(`   ❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    });

  } catch (error) {
    const errorMsg = `Failed to initialize project: ${error}`;
    console.log(`   ❌ ${errorMsg}`);
    result.errors.push(errorMsg);
  }

  return result;
}

/**
 * Validate that no deep imports remain
 */
function validateNoDeepImports(): boolean {
  console.log('\n🔍 Validating no deep imports remain...\n');
  
  try {
    const files = glob.sync('**/*.{ts,tsx}', {
      ignore: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'coverage/**',
        '**/*.d.ts',
        'tests/**/*'
      ]
    });

    const deepImportPattern = /from\s+['"]@\/lib\/shared\/constants\/(?!index)([^'"]+)['"]/;
    const violations: string[] = [];

    files.forEach(filePath => {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (deepImportPattern.test(line)) {
            violations.push(`${filePath}:${index + 1} - ${line.trim()}`);
          }
        });
      } catch (error) {
        console.log(`   ⚠️  Could not read ${filePath}: ${error}`);
      }
    });

    if (violations.length > 0) {
      console.log('❌ Deep imports still found:');
      violations.forEach(violation => {
        console.log(`   ${violation}`);
      });
      return false;
    } else {
      console.log('✅ No deep imports found!');
      return true;
    }
  } catch (error) {
    console.log(`❌ Validation failed: ${error}`);
    return false;
  }
}

/**
 * Generate summary report
 */
function generateReport(result: RefactorResult): void {
  console.log('\n📊 Refactoring Summary\n');
  
  console.log(`📋 Results:`);
  console.log(`   Files processed: ${result.filesProcessed}`);
  console.log(`   Imports replaced: ${result.importsReplaced}`);
  console.log(`   Errors: ${result.errors.length}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    result.errors.forEach(error => {
      console.log(`   ${error}`);
    });
  }
  
  console.log('\n📋 Next Steps:');
  console.log('   1. Run typecheck to ensure no type errors');
  console.log('   2. Run tests to ensure functionality is preserved');
  console.log('   3. Run ESLint to check for any remaining issues');
  console.log('   4. Commit the changes');
}

/**
 * Main execution function
 */
function main() {
  console.log('🔍 Constants Barrel Import Refactoring\n');
  
  const result = refactorConstantsBarrel();
  generateReport(result);
  
  const isValid = validateNoDeepImports();
  
  if (!isValid) {
    console.log('\n❌ Validation failed - some deep imports remain');
    process.exit(1);
  }
  
  console.log('\n✅ Refactoring completed successfully!');
}

// Run if this is the main module
if (process.argv[1] && process.argv[1].endsWith('refactor-constants-barrel.ts')) {
  main();
}

export { refactorConstantsBarrel, validateNoDeepImports };

