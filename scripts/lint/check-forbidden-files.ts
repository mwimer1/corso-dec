#!/usr/bin/env tsx
/**
 * Check for forbidden files in the repository
 * 
 * Checks for:
 * - .bak backup files (tracked and untracked)
 * - __tmp__ directories or files
 * 
 * Usage:
 *   tsx scripts/lint/check-forbidden-files.ts
 */

import { execSync } from 'node:child_process';
import { globSync } from 'glob';

interface ForbiddenPattern {
  name: string;
  gitPattern: string;
  globPattern: string[];
}

const FORBIDDEN_PATTERNS: ForbiddenPattern[] = [
  {
    name: 'backup files',
    gitPattern: '"*.bak" "**/*.bak"',
    globPattern: ['**/*.bak'],
  },
  {
    name: '__tmp__ directories',
    gitPattern: '"**/__tmp__/**" "**/__tmp__"',
    globPattern: ['**/__tmp__/**', '**/__tmp__'],
  },
];

const IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '.next/**',
  'dist/**',
  'build/**',
  'coverage/**',
];

function checkTrackedFiles(pattern: ForbiddenPattern): string[] {
  try {
    const output = execSync(
      `git ls-files ${pattern.gitPattern}`,
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch (error) {
    // Git command failed (might not be in a git repo or no matches)
    return [];
  }
}

function checkUntrackedFiles(pattern: ForbiddenPattern): string[] {
  try {
    const files = globSync(pattern.globPattern, {
      ignore: IGNORE_PATTERNS,
    });
    return files;
  } catch (error) {
    // Glob failed
    return [];
  }
}

function main() {
  const allForbidden: Array<{ pattern: string; files: string[] }> = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    const tracked = checkTrackedFiles(pattern);
    const untracked = checkUntrackedFiles(pattern);
    
    // Remove tracked files from untracked list (they might overlap)
    const untrackedOnly = untracked.filter(
      file => !tracked.includes(file)
    );

    const allFiles = [...tracked, ...untrackedOnly];

    if (allFiles.length > 0) {
      allForbidden.push({
        pattern: pattern.name,
        files: allFiles,
      });
    }
  }

  if (allForbidden.length === 0) {
    console.log('✅ No forbidden files found.');
    process.exit(0);
  }

  // Report all forbidden files
  console.error('❌ Forbidden files present:\n');
  
  for (const { pattern, files } of allForbidden) {
    console.error(`\n${pattern}:`);
    for (const file of files) {
      console.error(`  ${file}`);
    }
  }

  console.error('');
  process.exit(1);
}

void main();

