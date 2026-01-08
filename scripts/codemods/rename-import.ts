#!/usr/bin/env tsx

/**
 * TypeScript-based import renaming utility
 * 
 * Renames import paths across the codebase using ts-morph.
 * Provides better type safety and integration with our shared utilities.
 * 
 * Usage: pnpm tsx scripts/codemods/rename-import.ts --from "@/lib/monitoring" --to "@/lib/monitoring"
 */

import { discoverTypeScriptFiles } from './file-discovery';
import { createCodemodProject } from './ts-project';

// Get command line arguments
const args = process.argv.slice(2);
const fromIndex = args.findIndex(arg => arg === '--from');
const toIndex = args.findIndex(arg => arg === '--to');

if (fromIndex === -1 || toIndex === -1) {
  console.error('❌ Usage: pnpm tsx scripts/codemods/rename-import.ts --from "old-path" --to "new-path"');
  process.exit(1);
}

const fromPath = args[fromIndex + 1];
const toPath = args[toIndex + 1];

if (!fromPath || !toPath) {
  console.error('❌ Both --from and --to must have values');
  process.exit(1);
}

console.log(`🔄 Renaming imports from "${fromPath}" to "${toPath}"...\n`);

// Create ts-morph project using shared utility
// Using createCodemodProject for this is a codemod script that processes multiple file patterns
const project = createCodemodProject();

// Discover TypeScript files using shared utility
const files = discoverTypeScriptFiles();

console.log(`📁 Found ${files.length} files to process`);

let modifiedFiles = 0;
let totalChanges = 0;

for (const filePath of files) {
  const sourceFile = project.addSourceFileAtPath(filePath);
  let fileModified = false;
  let changes = 0;

  // Find import declarations that match the from path
  const importDeclarations = sourceFile.getImportDeclarations();
  
  for (const importDecl of importDeclarations) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    
    if (moduleSpecifier.startsWith(fromPath)) {
      const newModuleSpecifier = moduleSpecifier.replace(fromPath, toPath);
      importDecl.setModuleSpecifier(newModuleSpecifier);
      fileModified = true;
      changes++;
      console.log(`  📝 ${filePath}: Changed import from "${moduleSpecifier}" to "${newModuleSpecifier}"`);
    }
  }

  // Find require() calls that match the from path
  const callExpressions = sourceFile.getDescendantsOfKind(require('ts-morph').SyntaxKind.CallExpression);
  
  for (const callExpr of callExpressions) {
    const callExprNode = callExpr as any;
    const expression = callExprNode.getExpression();
    
    if (expression.getText() === 'require') {
      const arguments_ = callExprNode.getArguments();
      
      if (arguments_.length > 0) {
        const firstArg = arguments_[0];
        
        if (firstArg.getKind() === require('ts-morph').SyntaxKind.StringLiteral) {
          const stringLit = firstArg as any;
          const argText = stringLit.getLiteralValue();
          
          if (typeof argText === 'string' && argText.startsWith(fromPath)) {
            const newArgText = argText.replace(fromPath, toPath);
            firstArg.replaceWithText(`'${newArgText}'`);
            fileModified = true;
            changes++;
            console.log(`  📝 ${filePath}: Changed require from "${argText}" to "${newArgText}"`);
          }
        }
      }
    }
  }

  // Find string literals that match the from path
  const stringLiterals = sourceFile.getDescendantsOfKind(require('ts-morph').SyntaxKind.StringLiteral);
  
  for (const stringLit of stringLiterals) {
    const stringLitNode = stringLit as any;
    const literalValue = stringLitNode.getLiteralValue();
    
    if (typeof literalValue === 'string' && literalValue.startsWith(fromPath)) {
      const newValue = literalValue.replace(fromPath, toPath);
      stringLit.replaceWithText(`'${newValue}'`);
      fileModified = true;
      changes++;
      console.log(`  📝 ${filePath}: Changed string literal from "${literalValue}" to "${newValue}"`);
    }
  }

  if (fileModified) {
    sourceFile.saveSync();
    modifiedFiles++;
    totalChanges += changes;
  }
}

console.log(`\n✅ Rename operation complete!`);
console.log(`📊 Modified ${modifiedFiles} files with ${totalChanges} total changes`);
console.log(`\n⚠️  Please review the changes and test thoroughly before committing.`);

