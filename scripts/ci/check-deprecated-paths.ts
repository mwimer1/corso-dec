#!/usr/bin/env tsx
/**
 * Guardrail: Check for deprecated path references
 * 
 * Prevents reintroduction of old paths:
 * - tools/ast-grep/ (should be scripts/rules/ast-grep/)
 * - .astgrep/ (should be scripts/rules/ast-grep/)
 * - tools/eslint-plugin-corso/ (should be eslint-plugin-corso/)
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DEPRECATED_PATTERNS = [
  { pattern: /tools\/ast-grep/, message: 'tools/ast-grep/ should be scripts/rules/ast-grep/' },
  { pattern: /\.astgrep\//, message: '.astgrep/ should be scripts/rules/ast-grep/' },
  { pattern: /tools\/eslint-plugin-corso/, message: 'tools/eslint-plugin-corso/ should be eslint-plugin-corso/' },
];

const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'coverage',
  '.git',
  'build',
  '*.d.ts',
  'pnpm-lock.yaml',
];

const EXTENSIONS = ['.md', '.mdc', '.yml', '.yaml', '.json', '.ts', '.tsx', '.js', '.jsx', '.mjs'];

function shouldIgnore(path: string): boolean {
  // Exclude implementation-plan docs (they document the audit process and intentionally mention old paths)
  if (path.includes('.cursor/implementation-plan') || path.includes('implementation-plan')) {
    return true;
  }
  // Exclude this script itself (it mentions patterns in comments)
  if (path.includes('check-deprecated-paths.ts')) {
    return true;
  }
  return IGNORE_PATTERNS.some(ignore => path.includes(ignore));
}

function hasRelevantExtension(path: string): boolean {
  return EXTENSIONS.some(ext => path.endsWith(ext));
}

function checkFile(filePath: string): Array<{ file: string; line: number; pattern: string; message: string }> {
  const issues: Array<{ file: string; line: number; pattern: string; message: string }> = [];
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      DEPRECATED_PATTERNS.forEach(({ pattern, message }) => {
        if (pattern.test(line)) {
          issues.push({
            file: relative(process.cwd(), filePath),
            line: index + 1,
            pattern: pattern.toString(),
            message,
          });
        }
      });
    });
  } catch (error) {
    // Skip files that can't be read (binary, etc.)
  }
  
  return issues;
}

function walkDirectory(dir: string, issues: Array<{ file: string; line: number; pattern: string; message: string }>): void {
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      
      if (shouldIgnore(fullPath)) {
        continue;
      }
      
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDirectory(fullPath, issues);
      } else if (stat.isFile() && hasRelevantExtension(fullPath)) {
        const fileIssues = checkFile(fullPath);
        issues.push(...fileIssues);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
}

function main() {
  const issues: Array<{ file: string; line: number; pattern: string; message: string }> = [];
  
  walkDirectory(process.cwd(), issues);
  
  if (issues.length > 0) {
    console.error('❌ Found deprecated path references:\n');
    
    issues.forEach(({ file, line, message }) => {
      console.error(`  ${file}:${line} - ${message}`);
    });
    
    console.error('\nPlease update these references to use the correct paths:');
    console.error('  - scripts/rules/ast-grep/ (not tools/ast-grep/ or .astgrep/)');
    console.error('  - eslint-plugin-corso/ (not tools/eslint-plugin-corso/)');
    
    process.exit(1);
  }
  
  console.log('✅ No deprecated path references found');
}

main();

