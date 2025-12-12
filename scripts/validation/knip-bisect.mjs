#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../');
const defaultDirs = ['app','components','hooks','lib','types','styles','contexts','actions','config'];
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : defaultDirs;

function readKnipBase() {
  const p = resolve(root, '.knip.jsonc');
  return fs.readFileSync(p, 'utf8');
}

function narrowConfig(base, dir) {
  // Replace entry array to only include this dir (keep app router basics to satisfy Next entries)
  const entryPat = /"entry"\s*:\s*\[[\s\S]*?\]/m;
  const projectPat = /"project"\s*:\s*\[[\s\S]*?\]/m;
  const narrowedEntry = `"entry": ["${dir}/**/*.{ts,tsx}","app/**/page.tsx","app/**/layout.tsx","app/**/route.ts"]`;
  const narrowedProject = '"project": ["config/typescript/tsconfig.tooling.json"]';
  let out = base.replace(entryPat, narrowedEntry);
  out = out.replace(projectPat, narrowedProject);
  return out;
}

function runKnipWithConfig(cfgPath) {
  return new Promise((resolveP) => {
    const exe = process.platform === 'win32' ? 'pnpm' : 'pnpm';
    const args = ['-s', 'dlx', 'knip@5.62.0', '--config', cfgPath, '--include', 'files,dependencies,exports', '--no-gitignore'];
    const child = spawn(exe, args, { cwd: root, stdio: 'inherit', shell: true });
    child.on('exit', (code) => resolveP(code ?? 1));
  });
}

(async () => {
  const base = readKnipBase();
  const results = [];
  for (const dir of dirs) {
    const cfg = narrowConfig(base, dir);
    const safe = dir.replace(/[\\/]/g, '__');
    const tmp = resolve(root, `.knip.${safe}.jsonc`);
    fs.writeFileSync(tmp, cfg, 'utf8');
    console.log(`\n--- Knip (bisect) for: ${dir} ---`);
    const code = await runKnipWithConfig(tmp);
    try { fs.unlinkSync(tmp); } catch {}
    results.push({ dir, code });
  }
  const failing = results.filter(r => r.code !== 0);
  console.log('\nSummary:', results.map(r => `${r.dir}:${r.code}`).join(' '));
  if (failing.length) {
    console.error('Knip crashed/failed for:', failing.map(f => f.dir).join(', '));
    process.exit(1);
  }
})();


