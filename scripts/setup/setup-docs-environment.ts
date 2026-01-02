#!/usr/bin/env tsx
// scripts/setup/setup-docs-environment.ts
// DEPRECATED: This file is a compatibility wrapper.
// Use scripts/setup/recommend-docs-environment.ts instead.

import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.warn('⚠️  DEPRECATED: setup-docs-environment.ts has been renamed to recommend-docs-environment.ts');
console.warn('   This script only prints recommendations and does not modify files.');
console.warn('   Update your scripts to use: pnpm docs:setup (still works) or the new script directly.\n');

// Execute the new script
const newScriptPath = join(__dirname, 'recommend-docs-environment.ts');
const result = spawnSync('tsx', [newScriptPath], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  cwd: process.cwd(),
});

process.exitCode = result.status ?? 0;
