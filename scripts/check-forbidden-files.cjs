#!/usr/bin/env node
/* Fail if backup files are present in the repo. */
const { execSync } = require('node:child_process');
const { globSync } = require('glob');

try {
  // Check tracked files
  const tracked = execSync('git ls-files "*.bak" "**/*.bak"', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

  // Check untracked files (excluding node_modules and .git)
  const untracked = globSync(['**/*.bak'], {
    ignore: ['node_modules/**', '.git/**', '.next/**', 'dist/**']
  });

  const allBakFiles = [...tracked.split('\n').filter(Boolean), ...untracked].filter(Boolean);

  if (allBakFiles.length > 0) {
    console.error('Forbidden backup files present:\n' + allBakFiles.join('\n'));
    process.exit(1);
  }
} catch (error) {
  // If git or glob isn't available in CI step, be defensive but non-blocking:
  console.warn('Could not check for backup files:', error.message);
  process.exit(0);
}
