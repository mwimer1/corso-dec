// tools/scripts/audit-breakpoints.ts
// Read-only audit to find hardcoded breakpoint literals and suggest tokenized replacements
import { globby } from 'globby';
import fs from 'node:fs/promises';

const PX = new Map<string, string>([
  ['640px', "px(BREAKPOINT.sm) / mq.up('sm')"],
  ['768px', "px(BREAKPOINT.md) / mq.up('md')"],
  ['1024px', "px(BREAKPOINT.lg) / mq.up('lg')"],
  ['1280px', "px(BREAKPOINT.xl) / mq.up('xl')"],
  ["1536px", "px(BREAKPOINT['2xl']) / mq.up('2xl')"],
]);
const VW = new Map<string, string>([['100vw', 'vw(100)']]);

const GLOBS = [
  '{app,components,styles,lib}/**/*.{ts,tsx,css,mdx}',
  '!**/node_modules/**',
  '!styles/tokens/**',
  '!tools/**',
];

(async () => {
  const files = await globby(GLOBS);
  let count = 0;
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    const hits = new Set<string>();
    for (const key of [...PX.keys(), ...VW.keys()]) {
      if (text.includes(key)) hits.add(key);
    }
    if (hits.size) {
      count += hits.size;
      const suggestions = [...hits]
        .map((h) => `  - ${h} → ${PX.get(h) ?? VW.get(h)}`)
        .join('\n');
      console.log(`\n${file}\n${suggestions}`);
    }
  }
  console.log(`\nTotal hardcoded breakpoint literals found: ${count}`);
})();

