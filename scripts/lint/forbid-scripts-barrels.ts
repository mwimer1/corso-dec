#!/usr/bin/env tsx
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



