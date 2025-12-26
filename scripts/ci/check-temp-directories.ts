#!/usr/bin/env tsx
/**
 * Guardrail: Check that tmp/ and supabase/.temp/ are properly handled
 * 
 * Fails if:
 * - tmp/ or supabase/.temp/ contain tracked files in git (they should be gitignored)
 * - tmp/ or supabase/.temp/ exist but are not gitignored AND don't have a README explaining why
 * 
 * Usage:
 *   tsx scripts/ci/check-temp-directories.ts
 */

import { execSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CheckResult } from './check-common.js';

/**
 * Directories that should be ephemeral (gitignored) or have READMEs
 */
const TEMP_DIRECTORIES = [
  'tmp',
  'supabase/.temp',
];

/**
 * Check if a path is gitignored
 */
function isGitignored(path: string): boolean {
  try {
    // Use git check-ignore to see if the path is ignored
    execSync(`git check-ignore "${path}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    // git check-ignore returns non-zero if path is not ignored
    return false;
  }
}

/**
 * Check if a directory has tracked files in git
 */
function hasTrackedFiles(path: string): string[] {
  try {
    const output = execSync(
      `git ls-files "${path}"`,
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 10 * 1024 * 1024,
      }
    );
    return output.trim().split('\n').filter(Boolean);
  } catch {
    // Command failed (might not be in git repo or no matches)
    return [];
  }
}

/**
 * Check if a directory has a README.md file
 */
async function hasReadme(dirPath: string): Promise<boolean> {
  try {
    await access(join(dirPath, 'README.md'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Read README content to check if it explains why the directory is versioned
 */
async function readmeExplainsVersioning(dirPath: string): Promise<boolean> {
  try {
    const readmePath = join(dirPath, 'README.md');
    const content = await readFile(readmePath, 'utf8');
    
    // Check for keywords that suggest the README explains versioning
    const keywords = [
      'versioned',
      'tracked',
      'git',
      'committed',
      'temporary',
      'ephemeral',
      'purpose',
      'why',
      'reason',
    ];
    
    const lowerContent = content.toLowerCase();
    return keywords.some(keyword => lowerContent.includes(keyword));
  } catch {
    return false;
  }
}

/**
 * Check a single temp directory
 */
async function checkTempDirectory(dirPath: string): Promise<CheckResult> {
  // Check if directory exists
  try {
    await access(dirPath);
  } catch {
    // Directory doesn't exist - that's fine
    return {
      success: true,
      message: `${dirPath} does not exist (OK)`,
    };
  }
  
  const trackedFiles = hasTrackedFiles(dirPath);
  const isIgnored = isGitignored(dirPath);
  const hasReadmeFile = await hasReadme(dirPath);
  
  // If directory is gitignored, that's the preferred state
  if (isIgnored) {
    // But check if there are tracked files (shouldn't happen if properly ignored)
    if (trackedFiles.length > 0) {
      return {
        success: false,
        message: `${dirPath} is gitignored but contains tracked files`,
        details: [
          `Tracked files: ${trackedFiles.join(', ')}`,
          `This is a contradiction - gitignored directories should not have tracked files.`,
          `Either remove the files from git (git rm --cached) or remove them from .gitignore.`,
        ],
      };
    }
    
    return {
      success: true,
      message: `${dirPath} is properly gitignored`,
    };
  }
  
  // Directory is not gitignored - must have README explaining why
  if (!hasReadmeFile) {
    return {
      success: false,
      message: `${dirPath} is not gitignored and has no README.md`,
      details: [
        `Ephemeral directories must either be gitignored (preferred) or have a README.md explaining why they are versioned.`,
        `Add ${dirPath} to .gitignore, or create ${dirPath}/README.md explaining why it's tracked.`,
      ],
      recommendations: [
        `Add "${dirPath}/" to .gitignore if it's meant to be ephemeral`,
        `Or create ${dirPath}/README.md explaining why it's versioned`,
      ],
    };
  }
  
  // Has README - check if it explains versioning
  const explainsVersioning = await readmeExplainsVersioning(dirPath);
  if (!explainsVersioning) {
    return {
      success: false,
      message: `${dirPath} has README.md but doesn't explain why it's versioned`,
      details: [
        `The README.md should explain why this directory is tracked in git instead of being gitignored.`,
        `Update ${dirPath}/README.md to include an explanation.`,
      ],
      recommendations: [
        `Update ${dirPath}/README.md to explain why it's versioned`,
      ],
    };
  }
  
  // Check for tracked files even if it has README (should still be minimal)
  if (trackedFiles.length > 0) {
    return {
      success: true,
      message: `${dirPath} is versioned with README (has ${trackedFiles.length} tracked file(s))`,
      warnings: [
        `Consider if these files should be gitignored: ${trackedFiles.slice(0, 5).join(', ')}${trackedFiles.length > 5 ? '...' : ''}`,
      ],
    };
  }
  
  return {
    success: true,
    message: `${dirPath} is versioned with explanatory README.md`,
  };
}

/**
 * Main check function
 */
async function checkTempDirectories(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  
  for (const dirPath of TEMP_DIRECTORIES) {
    const result = await checkTempDirectory(dirPath);
    results.push(result);
  }
  
  return results;
}

/**
 * Main entry point
 */
async function main() {
  const results = await checkTempDirectories();
  
  const failures = results.filter(r => !r.success);
  
  if (failures.length > 0) {
    console.error('\n❌ Temp directory check failed:\n');
    for (const result of failures) {
      console.error(result.message);
      if (result.details) {
        result.details.forEach(detail => console.error(`  ${detail}`));
      }
      if (result.recommendations) {
        console.error('\n💡 Recommendations:');
        result.recommendations.forEach(rec => console.error(`  - ${rec}`));
      }
    }
    console.error('');
    process.exit(1);
  }
  
  // Show warnings if any
  const warnings = results.flatMap(r => r.warnings || []);
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  console.log('\n✅ Temp directory check passed');
  process.exit(0);
}

void main();

