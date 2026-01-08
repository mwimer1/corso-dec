#!/usr/bin/env tsx
import fg from 'fast-glob';
import fs from 'node:fs';

const CLIENT_GLOBS = [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/client/**/*.{ts,tsx}',
];
const DISALLOWED = /from\s+['"]@\/lib\/server\//;

let violations: string[] = [];
for (const file of fg.sync(CLIENT_GLOBS, { dot: false })) {
  const src = fs.readFileSync(file, 'utf8');
  if (DISALLOWED.test(src)) violations.push(file);
}

if (violations.length) {
  console.error('❌ Cross-boundary imports (client→server) detected:\n' + violations.join('\n'));
  process.exit(1);
}
console.log('✅ No client→server cross-boundary imports found.');



