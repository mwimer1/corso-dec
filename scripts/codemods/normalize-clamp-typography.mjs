import { globby } from 'globby';
import { readFileSync, writeFileSync } from 'node:fs';

// Matches CSS clamp() functions in style attributes or CSS-in-JS, not JavaScript clamp() calls
// Look for clamp with rem/vw units (CSS clamp) vs JavaScript clamp with numbers
const CSS_CLAMP_RE = /clamp\(\s*([^,]+rem[^,]*)\s*,\s*([^,]+?)\s*,\s*([^)]+rem[^)]*)\s*\)/g;

const files = await globby([
  'components/**/*.{ts,tsx}',
  'app/**/*.{ts,tsx}',
  'styles/**/*.{css,ts}'
]);

let modifiedCount = 0;

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const next = src.replace(CSS_CLAMP_RE, (_m, min, mid, max) => {
    // Skip if already has calc()
    if (/calc\s*\(/i.test(mid)) return `clamp(${min}, ${mid}, ${max})`;

    // Skip if middle arg looks like a JavaScript expression (no rem/vw units)
    if (!/\d+(\.\d+)?rem|\d+(\.\d+)?vw|\d+(\.\d+)?px|\d+(\.\d+)?em/.test(mid)) {
      return `clamp(${min}, ${mid}, ${max})`;
    }

    modifiedCount++;
    return `clamp(${min.trim()}, calc(${mid.trim()}), ${max.trim()})`;
  });
  if (next !== src) {
    writeFileSync(f, next, 'utf8');
    console.log(`✅ Updated: ${f}`);
  }
}

console.log(`\n🎉 CSS clamp normalization complete! Modified ${modifiedCount} files.`);
