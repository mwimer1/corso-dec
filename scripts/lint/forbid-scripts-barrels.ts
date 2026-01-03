#!/usr/bin/env tsx
/**
 * Prevents barrel index files (index.ts, index.tsx, index.js) in the scripts/ directory.
 * 
 * Barrel files are forbidden under scripts/ to maintain explicit imports and
 * prevent circular dependencies. Only _utils directories are allowed to have barrels.
 * 
 * Intent: Prevent barrel files in scripts directory
 * Files: scripts directory index files (index.ts, index.tsx, index.js)
 * Invocation: pnpm scripts:forbid:scripts-barrels
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot, getRelativePath, createLintResult } from './_utils';

const SCRIPTS_DIR = join(getRepoRoot(), 'scripts');
const forbidden = new Set(['index.ts', 'index.tsx', 'index.js']);

function walk(dir: string, hits: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      // Allow barrel files in _utils directories (legitimate barrel exports)
      if (entry.name === '_utils') continue;
      walk(p, hits);
    } else if (forbidden.has(entry.name)) {
      hits.push(p);
    }
  }
  return hits;
}

function main() {
  const result = createLintResult();
  const hits = walk(SCRIPTS_DIR);
  
  if (hits.length) {
    for (const p of hits) {
      result.addError(getRelativePath(p));
    }
  }

  result.report({
    successMessage: '✅ No barrel index files under /scripts',
    errorPrefix: '❌',
  });
  
  // Custom output format to match original
  if (result.hasErrors()) {
    console.error('❌ Barrel index files are forbidden under /scripts:');
    for (const error of result.getErrors()) {
      console.error(' - ' + error);
    }
    process.exitCode = 1;
  }
}

main();



