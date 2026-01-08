// Simple build script for @corso/eslint-plugin
// Copies src/index.js to dist/index.js (no transpilation needed)
import fs from 'node:fs';
import path from 'node:path';

// Run from package dir (eslint-plugin-corso)
const root = process.cwd();
const src = path.join(root, 'src', 'index.js');
const outDir = path.join(root, 'dist');
const out = path.join(outDir, 'index.js');

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(src, out);
console.log(`[eslint-plugin-corso] Built ${path.relative(root, out)}`);


