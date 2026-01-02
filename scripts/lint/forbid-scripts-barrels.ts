#!/usr/bin/env tsx
import { readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCRIPTS_DIR = path.join(ROOT, 'scripts');
const forbidden = new Set(['index.ts', 'index.tsx', 'index.js']);

function walk(dir: string, hits: string[] = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      walk(p, hits);
    } else if (forbidden.has(entry.name)) {
      hits.push(p);
    }
  }
  return hits;
}

function main() {
  const hits = walk(SCRIPTS_DIR);
  if (hits.length) {
    console.error('❌ Barrel index files are forbidden under /scripts:');
    for (const p of hits) console.error(' - ' + path.relative(ROOT, p));
    process.exitCode = 1;
  } else {
    console.log('✅ No barrel index files under /scripts');
  }
}

main();



