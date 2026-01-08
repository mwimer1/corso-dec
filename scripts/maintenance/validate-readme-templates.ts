#!/usr/bin/env tsx

import { glob } from 'glob';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const BAD_MARKERS = [
  'README.scripts.hbs',
  'README.scripts',
];

function normalizeRel(p: string): string {
  const rel = path.isAbsolute(p) ? path.relative(process.cwd(), p) : p;
  return rel.replace(/\\/g, '/');
}

function isScriptsReadme(rel: string): boolean {
  return rel.startsWith('scripts/') && rel.endsWith('/README.md');
}

async function main() {
  const files = await glob('**/README.md', {
    ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'],
  });

  const offenders: Array<{ file: string; marker: string }> = [];

  for (const file of files) {
    const rel = normalizeRel(file);
    if (isScriptsReadme(rel)) continue;

    const content = await fs.readFile(file, 'utf8');
    const marker = BAD_MARKERS.find((m) => content.includes(m));
    if (marker) offenders.push({ file: rel, marker });
  }

  if (offenders.length) {
    console.error('❌ README template leakage detected (scripts template marker in non-scripts README):');
    for (const o of offenders) console.error(`- ${o.file} (found "${o.marker}")`);
    process.exit(1);
  }

  console.log('✅ README template validation passed');
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
