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

import { globSync } from 'glob';
import { COMMON_IGNORE_GLOBS } from '../utils/constants';
import { listTrackedFiles } from '../utils/git';

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

const IGNORE_PATTERNS = [...COMMON_IGNORE_GLOBS];

function checkTrackedFiles(pattern: ForbiddenPattern): string[] {
  // Use git utility for consistent behavior
  const files: string[] = [];
  for (const gitPattern of pattern.gitPattern.split(' ').filter(Boolean)) {
    // Remove quotes from pattern
    const cleanPattern = gitPattern.replace(/^"|"$/g, '');
    files.push(...listTrackedFiles(cleanPattern));
  }
  return files;
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
    return;
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
  process.exitCode = 1;
}

void main();

