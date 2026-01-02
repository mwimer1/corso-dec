#!/usr/bin/env tsx
/**
 * Regression guard: Prevents reintroducing process.exit() calls in CI/lint scripts
 * 
 * This script scans scripts/ci and scripts/lint directories for forbidden process.exit()
 * calls and fails if any are found. This ensures all scripts use process.exitCode
 * instead, allowing logs to flush and reports to be written before the process exits.
 * 
 * Usage:
 *   pnpm lint:no-process-exit
 * 
 * Exit behavior:
 *   Sets process.exitCode = 1 if any violations found, otherwise 0.
 *   Never calls process.exit() itself (would be ironic!).
 */

import { readFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const SCAN_DIRS = ['scripts/ci', 'scripts/lint'];
const ALLOWED_EXTENSIONS = ['.ts', '.js', '.mjs', '.cjs'];
const FORBIDDEN_PATTERN = /process\.exit\s*\(/;
const ALLOWED_PATTERN = /process\.exitCode/; // This is OK

interface Violation {
  file: string;
  line: number;
  content: string;
}

function shouldScanFile(filePath: string): boolean {
  const ext = extname(filePath);
  return ALLOWED_EXTENSIONS.includes(ext);
}

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  
  try {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (!trimmedLine) {
        return;
      }
      
      // Skip comment-only lines (// or /* or * or # for .mjs/.cjs)
      if (/^\s*(\/\/|\/\*|\*\/|\*|#)/.test(trimmedLine)) {
        return;
      }
      
      // Skip JSDoc comments (lines starting with /** or */)
      if (/^\s*(\/\*\*|\*\/)/.test(trimmedLine)) {
        return;
      }
      
      // Skip string literals containing the pattern (documentation strings)
      // Simple heuristic: if line is primarily a string, skip it
      if (/^['"`]/.test(trimmedLine) || trimmedLine.endsWith("'") || trimmedLine.endsWith('"') || trimmedLine.endsWith('`')) {
        return;
      }
      
      // Skip lines that contain process.exitCode (those are allowed)
      if (ALLOWED_PATTERN.test(line)) {
        return;
      }
      
      // Check for forbidden process.exit() calls in actual code
      // Only match if it looks like actual code (not in a string literal on this line)
      const codeMatch = line.match(/process\.exit\s*\(/);
      if (codeMatch) {
        // Verify it's not inside a string literal by checking quotes before the match
        const beforeMatch = line.substring(0, codeMatch.index!);
        const singleQuotes = (beforeMatch.match(/'/g) || []).length;
        const doubleQuotes = (beforeMatch.match(/"/g) || []).length;
        const backticks = (beforeMatch.match(/`/g) || []).length;
        
        // If we have an odd number of quotes before the match, we're inside a string
        if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backticks % 2 === 0) {
          violations.push({
            file: filePath,
            line: index + 1,
            content: trimmedLine,
          });
        }
      }
    });
  } catch (error) {
    // Skip files that can't be read (binary, permissions, etc.)
    console.warn(`Warning: Could not read ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return violations;
}

function walkDirectory(dir: string, violations: Violation[] = []): Violation[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      // Skip node_modules, .git, and other common ignore patterns
      if (entry.name === 'node_modules' || entry.name.startsWith('.') && entry.name !== '.github') {
        continue;
      }
      
      if (entry.isDirectory()) {
        walkDirectory(fullPath, violations);
      } else if (entry.isFile() && shouldScanFile(fullPath)) {
        const fileViolations = scanFile(fullPath);
        violations.push(...fileViolations);
      }
    }
  } catch (error) {
    // Skip directories that can't be read
    console.warn(`Warning: Could not read directory ${dir}: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  return violations;
}

function main(): void {
  const allViolations: Violation[] = [];
  
  for (const dir of SCAN_DIRS) {
    const violations = walkDirectory(dir);
    allViolations.push(...violations);
  }
  
  if (allViolations.length > 0) {
    console.error('❌ Found forbidden process.exit() calls in CI/lint scripts:\n');
    
    // Group by file for cleaner output
    const byFile = new Map<string, Violation[]>();
    for (const v of allViolations) {
      const relPath = relative(process.cwd(), v.file);
      if (!byFile.has(relPath)) {
        byFile.set(relPath, []);
      }
      byFile.get(relPath)!.push(v);
    }
    
    for (const [file, fileViolations] of byFile.entries()) {
      console.error(`  ${file}:`);
      for (const v of fileViolations) {
        console.error(`    Line ${v.line}: ${v.content}`);
      }
    }
    
    console.error('\n💡 Fix: Replace process.exit(code) with process.exitCode = code + return');
    console.error('   This allows logs to flush and reports to be written before the process exits.\n');
    
    process.exitCode = 1;
  } else {
    console.log('✅ No forbidden process.exit() calls found in CI/lint scripts');
  }
}

main();
