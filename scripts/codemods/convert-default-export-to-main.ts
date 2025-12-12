/**
 * Convert default-exported script entrypoints into executable main() form.
 *
 * BEFORE:
 *   export default async function run() { ... }
 *   export default function run() { ... }
 *   export default async () => { ... }
 *   export default () => { ... }
 *
 * AFTER:
 *   async function main() { ... }
 *   void main();
 *
 * Usage:
 *   pnpm -w tsx scripts/codemods/convert-default-export-to-main.ts [files...]
 *   # Without args, scans ./scripts and ./tools
 */
import fs from 'node:fs';
import path from 'node:path';

type Opts = { dry: boolean };

const args = process.argv.slice(2);
const opts: Opts = { dry: false };
const files: string[] = [];

for (const a of args) {
  if (a === '--dry') opts.dry = true;
  else files.push(a);
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      yield* walk(p);
    } else if (e.isFile() && p.endsWith('.ts') && !p.endsWith('.d.ts')) {
      yield p;
    }
  }
}

async function discover(): Promise<string[]> {
  if (files.length) return files;
  const roots = ['scripts', 'tools'].filter((d) => fs.existsSync(d));
  const out: string[] = [];
  for (const r of roots) for await (const f of walk(r)) out.push(f);
  return out;
}

function transform(source: string): { changed: boolean; code: string } {
  let code = source;
  let changed = false;

  // Pattern 1: export default async function NAME?(
  code = code.replace(
    /\bexport\s+default\s+async\s+function(?:\s+\w+)?\s*\(/g,
    () => {
      changed = true;
      return 'async function main(';
    },
  );

  // Pattern 2: export default function NAME?(
  code = code.replace(
    /\bexport\s+default\s+function(?:\s+\w+)?\s*\(/g,
    () => {
      changed = true;
      return 'function main(';
    },
  );

  // Pattern 3: export default async (...) => {
  code = code.replace(
    /\bexport\s+default\s+async\s*\(([^)]*)\)\s*=>\s*{/g,
    (_m, params) => {
      changed = true;
      return `async function main(${params}) {`;
    },
  );

  // Pattern 4: export default (...) => {
  code = code.replace(
    /\bexport\s+default\s*\(([^)]*)\)\s*=>\s*{/g,
    (_m, params) => {
      changed = true;
      return `function main(${params}) {`;
    },
  );

  // If we changed something, ensure we invoke main() exactly once.
  if (changed) {
    const hasCall =
      /\bvoid\s+main\(\);/.test(code) || /\bmain\(\);/.test(code);
    if (!hasCall) {
      code = code.replace(/\s*$/s, '\n\nvoid main();\n');
    }
  }

  return { changed, code };
}

async function run() {
  const targetFiles = await discover();
  let converted = 0;

  for (const f of targetFiles) {
    const src = await fs.promises.readFile(f, 'utf8');
    if (!/\bexport\s+default\b/.test(src)) continue;
    const { changed, code } = transform(src);
    if (!changed) continue;

    if (opts.dry) {
      console.log(`[dry] would convert: ${f}`);
    } else {
      await fs.promises.writeFile(f, code, 'utf8');
      console.log(`[write] converted: ${f}`);
    }
    converted++;
  }

  if (converted === 0) {
    console.log('No files converted.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});



