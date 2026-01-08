#!/usr/bin/env tsx
import fg from 'fast-glob';
import fs from 'node:fs';

const disallowed: RegExp[] = [
  // No disallowed deep imports currently
];

const files = fg.sync(["**/*.{ts,tsx}"], {
  ignore: ['**/{node_modules,.next,dist,coverage,reports}/**', '**/_archive/**'],
});
const bad: string[] = [];
for (const f of files) {
  const s = fs.readFileSync(f, 'utf8');
  if (disallowed.some((rx) => rx.test(s))) bad.push(f);
}
if (bad.length) {
  console.error("❌ Disallowed deep imports found:\n" + bad.join("\n"));
  process.exit(1);
}
console.log("✅ No disallowed deep imports (barrels-only upheld).");



