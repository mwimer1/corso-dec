#!/usr/bin/env tsx
/**
 * Guardrail: Check for deprecated path references
 * 
 * Prevents reintroduction of old paths:
 * - tools/ast-grep/ (should be scripts/rules/ast-grep/)
 * - .astgrep/ (should be scripts/rules/ast-grep/)
 * - tools/eslint-plugin-corso/ (should be eslint-plugin-corso/)
 */

import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { COMMON_IGNORE_PATTERNS } from '../utils/constants';
import { walkDirectorySync } from '../utils/fs/walker';

const DEPRECATED_PATTERNS = [
  { pattern: /tools\/ast-grep/, message: 'tools/ast-grep/ should be scripts/rules/ast-grep/' },
  { pattern: /\.astgrep\//, message: '.astgrep/ should be scripts/rules/ast-grep/' },
  { pattern: /tools\/eslint-plugin-corso/, message: 'tools/eslint-plugin-corso/ should be eslint-plugin-corso/' },
];

// Use common ignore patterns, plus script-specific exclusions
const ADDITIONAL_IGNORES = ['*.d.ts', 'pnpm-lock.yaml'];

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
  // Check common ignore patterns
  const pathParts = path.split(/[/\\]/);
  if (pathParts.some(part => COMMON_IGNORE_PATTERNS.includes(part as any))) {
    return true;
  }
  // Check additional ignores
  return ADDITIONAL_IGNORES.some(ignore => path.includes(ignore));
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

function collectIssues(dir: string): Array<{ file: string; line: number; pattern: string; message: string }> {
  const issues: Array<{ file: string; line: number; pattern: string; message: string }> = [];
  
  // Use unified walker to get all files
  const result = walkDirectorySync(dir, {
    maxDepth: 20, // Reasonable depth
    includeFiles: true,
    includeDirs: false,
    exclude: [...COMMON_IGNORE_PATTERNS, ...ADDITIONAL_IGNORES],
  });
  
  // Filter to relevant extensions and check each file
  for (const filePath of result.files) {
    if (shouldIgnore(filePath)) {
      continue;
    }
    
    if (hasRelevantExtension(filePath)) {
      const fileIssues = checkFile(filePath);
      issues.push(...fileIssues);
    }
  }
  
  return issues;
}

function main() {
  const issues = collectIssues(process.cwd());
  
  if (issues.length > 0) {
    console.error('❌ Found deprecated path references:\n');
    
    issues.forEach(({ file, line, message }) => {
      console.error(`  ${file}:${line} - ${message}`);
    });
    
    console.error('\nPlease update these references to use the correct paths:');
    console.error('  - scripts/rules/ast-grep/ (not tools/ast-grep/ or .astgrep/)');
    console.error('  - eslint-plugin-corso/ (not tools/eslint-plugin-corso/)');
    
    process.exitCode = 1;
  } else {
    console.log('✅ No deprecated path references found');
  }
}

main();

