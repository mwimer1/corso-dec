#!/usr/bin/env tsx
import fg from 'fast-glob';
import fs from 'node:fs';

const files = fg.sync(['**/*.{ts,tsx}'], {
  ignore: ['**/{node_modules,.next,dist,coverage,reports}/**'],
});

const bad: string[] = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  // Heuristic: finds z.object({ ... }) not followed by .strict()
  const matches = s.matchAll(/z\.object\s*\([\s\S]*?\)(?!\s*\.strict\(\))/g);
  if (matches && [...matches].length) bad.push(f);
}

if (bad.length) {
  console.error('❌ z.object() without .strict() found in:');
  console.error(bad.join('\n'));
  process.exit(1);
}
console.log('✅ All z.object() uses appear strict (heuristic).');



