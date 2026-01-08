#!/usr/bin/env tsx
/**
 * CI check to ensure generated documentation stays in sync with source code.
 * 
 * Runs documentation generators and checks if any files were modified.
 * Fails if generated docs are out of sync, indicating they need to be regenerated.
 * 
 * Intent: Ensure generated docs are always up-to-date
 * Files: eslint-plugin-corso/README.md, scripts/lint/README.md, scripts/rules/ast-grep/README.md
 * Invocation: pnpm docs:check:sync (CI only)
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

/**
 * Files that should be checked for changes after generation
 */
const GENERATED_DOCS = [
  'eslint-plugin-corso/README.md',
  'scripts/lint/README.md',
  'scripts/rules/ast-grep/README.md',
];

function main() {
  console.log('📖 Checking if generated documentation is in sync...\n');

  // Check if we're in a git repository
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore', cwd: repoRoot });
  } catch {
    console.warn('⚠️  Not in a git repository. Skipping sync check.');
    console.log('✅ Documentation generation completed (no git to check sync)');
    return;
  }

  // Get initial state of generated docs
  const initialStatus = new Map<string, string>();
  for (const doc of GENERATED_DOCS) {
    const docPath = join(repoRoot, doc);
    if (existsSync(docPath)) {
      try {
        const content = execSync('git diff HEAD -- ' + doc, {
          encoding: 'utf8',
          cwd: repoRoot,
          stdio: ['pipe', 'pipe', 'ignore'],
        });
        initialStatus.set(doc, content);
      } catch {
        // File might not be tracked yet
        initialStatus.set(doc, '');
      }
    }
  }

  // Run documentation generators
  console.log('🔄 Running documentation generators...\n');
  try {
    execSync('pnpm docs:generate:lint', {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('❌ Failed to generate documentation');
    process.exitCode = 1;
    return;
  }

  // Check for changes
  const changes: string[] = [];
  for (const doc of GENERATED_DOCS) {
    const docPath = join(repoRoot, doc);
    if (!existsSync(docPath)) {
      changes.push(`Missing: ${doc}`);
      continue;
    }

    try {
      const currentContent = execSync('git diff HEAD -- ' + doc, {
        encoding: 'utf8',
        cwd: repoRoot,
        stdio: ['pipe', 'pipe', 'ignore'],
      });

      const initialContent = initialStatus.get(doc) || '';
      if (currentContent !== initialContent) {
        // Check if there are actual changes (not just whitespace)
        const hasRealChanges = currentContent.trim().length > 0 &&
          currentContent
            .split('\n')
            .some(line => line.startsWith('+') || line.startsWith('-'));

        if (hasRealChanges) {
          changes.push(doc);
        }
      }
    } catch {
      // File might not be tracked, check if it exists and has content
      try {
        const { readFileSync } = require('node:fs');
        const content = readFileSync(docPath, 'utf-8');
        if (content.trim().length > 0 && !initialStatus.has(doc)) {
          changes.push(`New file: ${doc}`);
        }
      } catch {
        // Ignore read errors
      }
    }
  }

  // Report results
  if (changes.length > 0) {
    console.error('\n❌ Generated documentation is out of sync!\n');
    console.error('The following files have uncommitted changes:');
    for (const change of changes) {
      console.error(`  - ${change}`);
    }
    console.error('\n💡 To fix:');
    console.error('  1. Run: pnpm docs:generate:lint');
    console.error('  2. Review and commit the changes');
    console.error('\n💡 To check locally:');
    console.error('  git diff -- eslint-plugin-corso/README.md scripts/lint/README.md scripts/rules/ast-grep/README.md');
    process.exitCode = 1;
  } else {
    console.log('\n✅ Generated documentation is in sync!');
  }
}

main();
